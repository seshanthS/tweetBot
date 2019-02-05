pragma solidity ^0.5.0;


contract writeOnChain {
	address deployer;
	uint id;

	event Write(uint indexed id, string name, string msg);

  constructor() public {
  	deployer = msg.sender;

  }

  function write(string memory _name, string memory _msg) public {
  	id++;
  	emit Write(id, _name, _msg);
  }

}
