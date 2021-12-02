import jwt from 'jsonwebtoken';
import {levelScoringData} from "../task_submission";

export const getTaskTokenForLevel = (level, randomSeed) => {
  return getTaskTokenObject(level, randomSeed).get();
}

export const getAnswerTokenForLevel = (answer, level, randomSeed) => {
  return getTaskTokenObject(level, randomSeed).getAnswerToken(answer);
}

export const getTaskTokenObject = (level: string, randomSeed) => {
  const query = {
    taskID: window.options ?window.options.defaults.taskID : null,
    version: level,
  };

  if (level) {
    randomSeed += levelScoringData[level].stars;
  }

  return new TaskToken({
    itemUrl: generateTokenUrl(query),
    randomSeed: randomSeed,
  }, 'buddy');
}

// Code extracted from miniPlatform.js
export class TaskToken {
  private readonly data: any;
  private readonly key: string;
  private readonly queryToken: string;

  constructor(data, key) {
    this.data = data;
    this.data.sHintsRequested = "[]";
    this.key = key;
    const query = document.location.search.replace(/(^\?)/, '').split("&").map(function (n) {
      return n = n.split("="), this[n[0]] = n[1], this
    }.bind({}))[0];
    this.queryToken = query.sToken;
  }

  update(newData, callback) {
    for (let key in newData) {
      this.data[key] = newData[key];
    }
  }

  getToken(data, callback?) {
    let res = jwt.sign(data, this.key)
    if (callback) {
      // imitate async req
      setTimeout(function () {
        callback(res)
      }, 0);
    }
    return res;
  }

  get(callback?) {
    if (jwt.isDummy && this.queryToken) {
      let token = this.queryToken;
      if (callback) {
        // imitate async req
        setTimeout(function () {
          callback(token)
        }, 0);
      }
      return token;
    }
    return this.getToken(this.data, callback);
  }

  getAnswerToken(answer, callback?) {
    let answerData: {sAnswer?: any} = {};
    for (let key in this.data) {
      answerData[key] = this.data[key];
    }
    answerData.sAnswer = answer;

    return this.getToken(answerData, callback);
  }
}

export function generateTokenUrl(options) {
  delete options[''];
  const params = new URLSearchParams(options);
  const stringified = params.toString();

  return window.location.protocol + '//' + window.location.host + window.location.pathname + (stringified ? '?' + stringified : '');
}
