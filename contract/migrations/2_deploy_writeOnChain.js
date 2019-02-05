var writeOnChain = artifacts.require('./writeOnChain.sol');

module.exports = (deployer)=>{
	deployer.deploy(writeOnChain);
}