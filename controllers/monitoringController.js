const Check = require("../models/Check");
const Report = require("../models/Report");
const { Monitor } = require("../monitor/Monitor");

let fetchingTimer = true;

exports.startMonitor = async function (req, res, next) {
  let checkId = req.params.checkId;
  let userId = req.userId;
  const check = await Check.findById(checkId);
  const monitor = new Monitor(check, userId);
  fetchingTimer = true;
  const fetchWorker = async function () {
    try {
      await monitor.init();

      monitor.startCheck();
      // let report  =
      await monitor.monitoring();
      let report = await monitor.getCheckReoprt();

      // res.status(200).json({
      //   message: `The report for check number ${check._id} is : `,
      //   Report: report,
      // });
      console.log("runing .......");
    } catch (err) {
      monitor.stopCheck();
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
    if (fetchingTimer) {
      setTimeout(fetchWorker, check.interval * 1000);
    }
  };

  setTimeout(fetchWorker, check.interval  * 1000);

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

// exports.getReportById = async function (req, res, next) {
//   const userId = req.userId;
//   const reportId = req.params.reportId
//   const report = await Report.findById(reportId);
//   res.status(200).json({
//     message : `User ${userId} reports is `,
//     Reports : allReports
//   })
// };

exports.stopMonitor = async function (req, res, next) {
  fetchingTimer = false;
  console.log("stopped .......");
  res.status(200).json({
    message: "Checking stopped",
  });
};
