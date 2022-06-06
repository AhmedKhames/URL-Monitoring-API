const Check = require("../models/Check");
const Report = require("../models/Report");
const { Monitor } = require("../monitor/Monitor");

let fetchingTimer = true;
const fetchWorker = async function (check, monitor, next) {
  try {
    await monitor.init();
    monitor.startCheck();
    await monitor.monitoring();
    let report = await monitor.getCheckReoprt();

    console.log("runing .......");
  } catch (err) {
    monitor.stopCheck();
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  if (fetchingTimer) {
    setTimeout(fetchWorker, check.interval * 1000, check, monitor, next);
  }
};

exports.startMonitor = async function (req, res, next) {
  let checkId = req.params.checkId;
  let userId = req.userId;
  const check = await Check.findById(checkId);
  const monitor = new Monitor(check, userId);
  fetchingTimer = true;

  setTimeout(fetchWorker, check.interval * 1000, check, monitor, next);

  res.status(200).json({
    message: `The report saving started.... `,
  });
};

exports.getAllReports = async function (req, res, next) {
  const userId = req.userId;
  const allReports = await Report.find({ userId: userId });
  res.status(200).json({
    message: `User ${userId} reports is `,
    Reports: allReports,
  });
};

exports.startMonitorByTag = async function (req, res, next) {
  const tag = req.params.tag;
  const userId = req.userId;
  const getCheckByTag = await Check.find({ tags: tag, userId: userId });

  res.status(200).json({
    message: "Checks by tags",
    Checks: getCheckByTag,
  });
};

exports.stopMonitor = async function (req, res, next) {
  fetchingTimer = false;
  console.log("stopped .......");
  res.status(200).json({
    message: "Checking stopped",
  });
};
