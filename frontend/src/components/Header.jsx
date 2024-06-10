import React from "react";
import NplLogo from "../assets/csir-npl.png";
function Header() {
  return (
    <div className="flex items-center justify-center m-2">
      <div className="">
        <img className="w-28 h-24" src={NplLogo} alt="" />
      </div>
      <div>
        <h1 className=" font-medium text-3xl">TIME TRACABILITY LAB</h1>
      </div>
    </div>
  );
}

export default Header;
