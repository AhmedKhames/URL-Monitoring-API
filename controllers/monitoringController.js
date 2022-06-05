const Check = require("../models/Check");
const Report = require("../models/Report");
const { Monitor } = require("../monitor/Monitor");

exports.startMonitor = async function (req, res, next) {
  try {
    let checkId = req.params.checkId;
    const check = await Check.findById(checkId);
    const monitor = new Monitor(check);

    await monitor.init();

    monitor.startCheck();
    await monitor.monitoring();
    let report = await monitor.getCheckReoprt();

    res.status(200).json({
      message: `The report for check number ${check._id} is : `,
      Report: report,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  //   let runInerval = setInterval(, check.interval * 1000);
};

exports.stopMonitor = async function (req, res, next) {
  let checkId = req.params.checkId;
};
