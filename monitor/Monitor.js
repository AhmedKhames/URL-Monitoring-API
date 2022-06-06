const Report = require("../models/Report");

const axios = require("axios").default;

const formData = require("form-data");
const mailgun = require("mailgun.js");
const User = require("../models/User");
require("dotenv").config();

const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = new mailgun(formData);
const client = mg.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

class Monitor {
  #check;
  #isStarted;
  #Report;
  #currentReoprt;
  #userId;
  constructor(check, userId) {
    this.#check = check;
    this.#isStarted = false;
    this.#userId = userId;
  }

  async init() {
    const reports = await Report.findOne({ checkId: this.#check._id });
    if (reports) {
      this.#Report = reports;
    } else {
      this.#Report = await Report.create({
        checkId: this.#check._id,
        userId: this.#userId,
        status: "0",
        availability: 0,
        downTime: 0,
        upTime: 0,
        outages: 0,
        responseTime: 0,
        history: [],
      });
    }
  }

  startCheck() {
    this.#isStarted = true;
  }

  stopCheck() {
    this.#isStarted = false;
  }

  async monitoring() {
    let updatedReport;
    if (this.#isStarted) {
      // start fetch the url on the check

      axios.interceptors.request.use(
        (req) => {
          req.metaData = { startTime: new Date() };

          return req;
        },
        (err) => {
          return Promise.reject(err);
        }
      );

      axios.interceptors.response.use(
        (res) => {
          res.config.metaData.endTime = new Date();
          //resonse time the server

          res.responseTime =
            res.config.metaData.endTime - res.config.metaData.startTime;
          //status code for the server
          res.metaData = { status: res.status };
          return res;
        },
        (err) => {
          return Promise.reject(err);
        }
      );

      try {
        let res = await axios.get(this.#check.url, {
          //   headers: this.#check.httpHeaders,
          timeout: this.#check.timeout * 1000,
        });
        updatedReport = await this.#updateReportDocumnet(
          res.metaData.status,
          res.responseTime
        );
      } catch (error) {
        updatedReport = await this.#updateReportDocumnet("404", 0, true);
        this.#sendMail();
      }

      return updatedReport;
    }
  }
  async #updateStatus(status) {
    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        status: status,
      }
    );
  }

  async #updateResponseTime(responseTime) {
    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        responseTime: responseTime,
      }
    );
  }
  async #updateHistoryTime() {
    const oldReport = {
      status: this.#Report.status,
      availability: this.#Report.availability,
      downTime: this.#Report.downTime,
      upTime: this.#Report.upTime,
      outages: this.#Report.outages,
      responseTime: this.#Report.responseTime,
      createdAt: this.#Report.createdAt,
      updatedAt: this.#Report.updatedAt,
      isDown: this.#Report.isDown,
    };

    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        $push: { history: oldReport },
      }
    );
  }

  async #calcUpTime() {
    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        $inc: {
          upTime: 1,
        },
        isDown: false,
      }
    );
  }

  async #calcDownTime() {
    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        $inc: {
          downTime: 1,
        },
        isDown: true,
      }
    );
  }

  async #calcAvailability() {
    let currentReport = await Report.findOne({
      checkId: this.#check._id,
      _id: this.#Report._id,
    });

    let upTime = currentReport.upTime;
    let downTime = currentReport.downTime;

    let availability = (upTime / (upTime + downTime)) * 100.0;

    currentReport.availability = availability;

    await currentReport.save();
  }
  async #getOldReports() {
    let oldReport = await Report.findOne(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      "history"
    );

    oldReport = oldReport["history"].filter((f) => f.isDown === true);

    return oldReport;
  }
  async #outage() {
    let oldReport = await this.#getOldReports();
    let numberOfDown = oldReport.length + 1;
    await Report.findOneAndUpdate(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
      {
        outages: numberOfDown,
      }
    );
  }
  async #sendMail() {
    let reports = await this.#getOldReports();
    let numberOfFaluirs = reports.length;
    let user = await User.findById(this.#userId);

    if (numberOfFaluirs >= this.#check.threshold) {
      const verificationMessage = {
        from: `test <ahmed@${DOMAIN}>`,
        to: user.email,
        subject: "The site is down",
        html: `<a>The site ${this.#check.url} is down </a>`,
      };
      await client.messages.create(DOMAIN, verificationMessage);
    }
  }

  async getCheckReoprt() {
    let report = await Report.find({
      checkId: this.#check._id,
      _id: this.#Report._id,
    });
    return report;
  }

  async #updateReportDocumnet(status, responseTime, isError = false) {
    try {
      // update status in report updateStatus(res.metaData.status)
      await this.#updateStatus(status);
      // update response time updateResponseTime(res.responseTime)
      await this.#updateResponseTime(responseTime);
      if (isError) {
        await this.#calcDownTime();
      } else {
        await this.#calcUpTime();
      }
      await this.#calcAvailability();
      await this.#updateHistoryTime();
      if (isError) {
        await this.#outage();
      }
      let result = await this.getCheckReoprt();
      return result;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = {
  Monitor,
};
