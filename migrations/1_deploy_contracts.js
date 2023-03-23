const MegaSwapFund = artifacts.require('./MegaSwapFund.sol');
const MegaMerger = artifacts.require('./MegaMerger.sol');
const MegaSplitter = artifacts.require('./MegaSplitter.sol');

const BigNumber = require('bignumber.js');

module.exports = async (deployer, network, accounts) => {
	const maxSwappableInAmountsCoeff = 20;
	const holdersSupplyCoeff = 4;

	let _INIT_SWAPOUT_COUNTERS_0 = [];
	const threadCount = 20;
	const swapFundSupply = 1e8;
	const decNumerator = 1e18;

	let s0;
	let unscaledSum = 0;

	// `_INIT_SWAPOUT_COUNTERS_0` values are best visualized on graph
	// when referred to as both points and volumes.
	// Therefore they should be values of an integral over the interval [i-1; i].
	//
	// But we use y=e^x here, so, in our case, integral is the same (F(e^x)=e^x).
	// If you use another function, your integral would be different.
	//
	// NOTE: The integrand and the x interval we use here are just our random choice,
	// they also can be many others.
	for (let i = 0; i <= threadCount; ++i) {
		let x = Math.E / threadCount * i;

		if (i > 0) {
			_INIT_SWAPOUT_COUNTERS_0[i - 1] = Math.exp(x) - s0;

			unscaledSum += _INIT_SWAPOUT_COUNTERS_0[i - 1];
		}

		s0 = Math.exp(x);
	}

	const scaler_div100 = swapFundSupply / unscaledSum / 100;
	let approxSum = 0;

	for (let i = 0; i < threadCount; ++i) {
		// Scale value to `swapFundSupply`.
		// Also, excessively round it to make even more "human friendly".
		_INIT_SWAPOUT_COUNTERS_0[i] = Math.round(_INIT_SWAPOUT_COUNTERS_0[i] * scaler_div100) * 100;

		approxSum += _INIT_SWAPOUT_COUNTERS_0[i];
	}

	// Make total sum equal to `swapFundSupply` (if it is not).
	_INIT_SWAPOUT_COUNTERS_0[threadCount - 1] += swapFundSupply - approxSum;

	for (let i = 0; i < threadCount; ++i) {
		_INIT_SWAPOUT_COUNTERS_0[i] = new BigNumber(_INIT_SWAPOUT_COUNTERS_0[i]).multipliedBy(decNumerator);
	}

	await deployer.deploy(
		MegaSwapFund,
		_INIT_SWAPOUT_COUNTERS_0,
		maxSwappableInAmountsCoeff,
		holdersSupplyCoeff);
}
