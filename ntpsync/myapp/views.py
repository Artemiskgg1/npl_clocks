from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import threading
import socket
import datetime
import struct
import time
import json

NTD_IP = [
    "172.16.26.3", "172.16.26.4", "172.16.26.7", "172.16.26.9",
    "172.17.26.10", "172.16.26.11", "172.16.26.12", "172.16.26.13",
    "172.16.26.14", "172.16.26.15", "172.17.26.16", "172.17.26.17"
]

log_file = "other_log.csv"
timestamp = 0

class NTPException(Exception):
    pass

class NTP:
    _SYSTEM_EPOCH = datetime.date(*time.gmtime(0)[0:3])
    _NTP_EPOCH = datetime.date(1900, 1, 1)
    NTP_DELTA = (_SYSTEM_EPOCH - _NTP_EPOCH).days * 24 * 3600

class NTPPacket:
    _PACKET_FORMAT = "!B B B b 11I"

    def __init__(self, version=2, mode=3, tx_timestamp=0):
        self.leap = 0
        self.version = version
        self.mode = mode
        self.stratum = 0
        self.poll = 0
        self.precision = 0
        self.root_delay = 0
        self.root_dispersion = 0
        self.ref_id = 0
        self.ref_timestamp = 0
        self.orig_timestamp = 0
        self.recv_timestamp = 0
        self.tx_timestamp = tx_timestamp

    def to_data(self):
        try:
            packed = struct.pack(NTPPacket._PACKET_FORMAT,
                (self.leap << 6 | self.version << 3 | self.mode),
                self.stratum,
                self.poll,
                self.precision,
                _to_int(self.root_delay) << 16 | _to_frac(self.root_delay, 16),
                _to_int(self.root_dispersion) << 16 | _to_frac(self.root_dispersion, 16),
                self.ref_id,
                _to_int(self.ref_timestamp),
                _to_frac(self.ref_timestamp),
                _to_int(self.orig_timestamp),
                _to_frac(self.orig_timestamp),
                _to_int(self.recv_timestamp),
                _to_frac(self.recv_timestamp),
                _to_int(self.tx_timestamp),
                _to_frac(self.tx_timestamp))
        except struct.error:
            raise NTPException("Invalid NTP packet fields.")
        return packed

    def from_data(self, data):
        try:
            unpacked = struct.unpack(NTPPacket._PACKET_FORMAT,
                    data[0:struct.calcsize(NTPPacket._PACKET_FORMAT)])
        except struct.error:
            raise NTPException("Invalid NTP packet.")
        self.leap = unpacked[0] >> 6 & 0x3
        self.version = unpacked[0] >> 3 & 0x7
        self.mode = unpacked[0] & 0x7
        self.stratum = unpacked[1]
        self.poll = unpacked[2]
        self.precision = unpacked[3]
        self.root_delay = float(unpacked[4])/2**16
        self.root_dispersion = float(unpacked[5])/2**16
        self.ref_id = unpacked[6]
        self.ref_timestamp = _to_time(unpacked[7], unpacked[8])
        self.orig_timestamp = _to_time(unpacked[9], unpacked[10])
        self.recv_timestamp = _to_time(unpacked[11], unpacked[12])
        self.tx_timestamp = _to_time(unpacked[13], unpacked[14])

class NTPStats(NTPPacket):
    def __init__(self):
        NTPPacket.__init__(self)
        self.dest_timestamp = 0

    @property
    def offset(self):
        return ((self.recv_timestamp - self.orig_timestamp) +
                (self.tx_timestamp - self.dest_timestamp)) / 2

    @property
    def delay(self):
        return ((self.dest_timestamp - self.orig_timestamp) -
                (self.tx_timestamp - self.recv_timestamp))

    @property
    def tx_time(self):
        return ntp_to_system_time(self.tx_timestamp)

    @property
    def recv_time(self):
        return ntp_to_system_time(self.recv_timestamp)

    @property
    def orig_time(self):
        return ntp_to_system_time(self.orig_timestamp)

    @property
    def ref_time(self):
        return ntp_to_system_time(self.ref_timestamp)

    @property
    def dest_time(self):
        return ntp_to_system_time(self.dest_timestamp)

class NTPClient:
    def __init__(self):
        pass

    def request(self, host, version=2, port='ntp', timeout=5):
        addrinfo = socket.getaddrinfo(host, port)[0]
        family, sockaddr = addrinfo[0], addrinfo[4]
        s = socket.socket(family, socket.SOCK_DGRAM)

        try:
            s.settimeout(timeout)
            query_packet = NTPPacket(mode=3, version=version,
                                tx_timestamp=system_to_ntp_time(time.time()))
            s.sendto(query_packet.to_data(), sockaddr)
            src_addr = None,
            while src_addr[0] != sockaddr[0]:
                response_packet, src_addr = s.recvfrom(256)
            dest_timestamp = system_to_ntp_time(time.time())
        except socket.timeout:
            raise NTPException("No response received from %s." % host)
        finally:
            s.close()
        stats = NTPStats()
        stats.from_data(response_packet)
        stats.dest_timestamp = dest_timestamp

        return stats

def _to_int(timestamp):
    return int(timestamp)

def _to_frac(timestamp, n=32):
    return int(abs(timestamp - _to_int(timestamp)) * 2**n)

def _to_time(integ, frac, n=32):
    return integ + float(frac) / 2**n

def ntp_to_system_time(timestamp):
    return timestamp - NTP.NTP_DELTA

def system_to_ntp_time(timestamp):
    return timestamp + NTP.NTP_DELTA

def send_time(host, data, server, bias, log_file, timestamp):
    host_ip, server_port = host, 10000
    tcp_client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        tcp_client.connect((host_ip, server_port))
        tcp_client.sendall(data)
        received = tcp_client.recv(1024)
        log_file.write(str(datetime.datetime.now()) + "," + time.ctime(timestamp - bias) + "," + host + ",Synchronized" + "," + str(bias) + "\r\n")
    except Exception as e:
        log_file.write(str(datetime.datetime.now()) + "," + time.ctime(timestamp - bias) + ","  + host + ",Not Connected" + "," + str(bias) + "\r\n")
    finally:
        tcp_client.close()


@csrf_exempt
def sync_ntd(request):
    global log_file  # Declare the file path as global

    if request.method == 'POST':
        data = json.loads(request.body)
        ntp_server_name = data['server']
        sync_time = 60 * int(data['sync_time'])
        bias = int(data['bias'])

        call = NTPClient()
        response = call.request(ntp_server_name, version=3)
        global timestamp
        timestamp = round(response.tx_time + bias)

        ntp_date = datetime.datetime.fromtimestamp(timestamp)
        header = b'\x55\xaa\x00\x00\x01\x01\x00\xc1\x00\x00\x00\x00\x00\x00\x0f\x00\x00\x00\x0f\x00\x10\x00'
        year_month_day = (ntp_date.year).to_bytes(2, byteorder="big") + (ntp_date.month).to_bytes(1, byteorder="big") + (ntp_date.day).to_bytes(1, byteorder="big")
        hour_minute_second = (ntp_date.hour).to_bytes(1, byteorder="big") + (ntp_date.minute).to_bytes(1, byteorder="big") + (ntp_date.second).to_bytes(1, byteorder="big")
        reserved = b'\x00\x00\x00\x00'
        payload = header + year_month_day + hour_minute_second + reserved

        # Open the log file in 'append' mode
        with open(log_file, "a") as log_file:
            for host in NTD_IP:
                threading.Thread(target=send_time, args=(host, payload, ntp_server_name, bias, log_file, timestamp)).start()

        return JsonResponse({"status": "success", "server": ntp_server_name, "sync_time": sync_time, "bias": bias, "timestamp": timestamp})
    else:
        return JsonResponse({"error": "Invalid request method"}, status=400)