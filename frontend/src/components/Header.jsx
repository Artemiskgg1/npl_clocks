import React from "react";
import NplLogo from "../assets/csir-npl.png";

function Header() {
  return (
    <div className="sticky top-0 bg-white z-50 flex items-center justify-center shadow-md">
      <div>
        <img className="w-28 h-24" src={NplLogo} alt="CSIR NPL Logo" />
      </div>
      <div>
        <h1 className="font-medium text-3xl">
          NATIONAL PHYSICAL LABORATORY (CSIR - NPL)
        </h1>
      </div>
    </div>
  );
}

export default Header;
