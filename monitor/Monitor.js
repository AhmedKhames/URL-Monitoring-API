const Report = require("../models/Report");

const axios = require("axios").default;

class Monitor {
  #check;
  #isStarted;
  #Report;
 

  constructor(check) {
    this.#check = check;
    this.#isStarted = false;
  }

  async init() {
    const reports = await Report.findOne({ checkId: this.#check._id });
    if (reports) {
      this.#Report = reports;
    } else {
      this.#Report = await Report.create({
        checkId: this.#check._id,
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

      axios
        .get(this.#check.url, {
          //   headers: this.#check.httpHeaders,
          timeout: this.#check.timeout * 1000,
        })
        .then((res) => {
          
          // if server is on up state
          // update status in report updateStatus(res.metaData.status)

          this.#updateStatus(res.metaData.status);
          // update response time updateResponseTime(res.responseTime)
          this.#updateResponseTime(res.responseTime);
          // increament upTime ()
          this.#calcUpTime();

          this.#calcAvailability();
          this.#updateHistoryTime();
        })
        .catch((err) => {
         
          // console.log(err);
          // if server is on down state
          this.#updateStatus("404");
          this.#updateResponseTime(0);
          //downTime()
          this.#calcDownTime();
          this.#calcAvailability();
          this.#updateHistoryTime();
          // update outage()
          this.#outage();
          //send mail
        })
        

      // if the response code >= 400 then the server is down else up
      // if the response take time more than timeout then faild else success (duration = responeTime - requestTime)
      // setInterval to make request to the server after check.interval time
      // ( The threshold of failed requests that will create an alert)
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
    const oldReport = await Report.findOne(
      {
        checkId: this.#check._id,
        _id: this.#Report._id,
      },
     'history'
    );
    return oldReport;
  }
  async #outage() {
    let oldReport = await this.#getOldReports();
    let numberOfDown = 1;
    for (const key of oldReport['history']) {
      if (key.downTime > 0) {
        numberOfDown++;
      }
    }
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

  async getCheckReoprt() {
    return this.#Report;
  }
}

module.exports = {
  Monitor,
};
