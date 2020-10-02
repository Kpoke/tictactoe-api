module.exports = function (seconds) {
  this.time = seconds;
  this.toPause = true;

  this.getTime = function () {
    return this.time;
  };

  this.setTime = function (newTime) {
    this.time = newTime;
  };

  this.start = function () {
    this.toPause = false;
    this.timer();
  };

  this.pause = function () {
    this.toPause = true;
    this.timer();
  };

  this.reset = function () {
    this.toPause = true;
    this.time = seconds;
    this.timer();
  };

  this.timer = function () {
    this.time &&
      !this.toPause &&
      setTimeout(() => {
        this.setTime(this.time - 1);
        this.timer();
      }, 1000);
  };
};
