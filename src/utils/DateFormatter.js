import moment from "moment";

const DateFormatter = {
  chatOverview: utc => {
    const relative = moment.unix(utc / 1000);
    const now = moment();
    const yesterday = now.clone().subtract(1, "days").startOf("day");
    const nowUnix = now.utc().unix();
    if (relative.isSame(now, "d")) return relative.format("HH:mm");
    if (relative.isSame(yesterday, "d")) return "Yesterday";
    if (nowUnix - utc <= 7 * 24 * 60 * 1000) return relative.format("ddd");

    return relative.format("DD.MM.YYYY");
  },
  lastSeen: utc => {
    /* For a date of yesterday, it should show: Yesterday 11:30 am
        For a date of day before yesterday, it should show: Mon 11:30 am

        Any date of last week or earlier, it should show 25-11-2020 
    */
  },
  message: utc => {
    const relative = moment.unix(utc / 1000);
    const now = moment();
    const yesterday = now.clone().subtract(1, "days").startOf("day");
    const nowUnix = now.utc().unix();

    if (relative.isSame(now, "d")) return relative.format("HH:mm");
    if (relative.isSame(yesterday, "d")) return "Yesterday, " + relative.format("HH:mm");
    if (nowUnix - utc <= 7 * 24 * 60 * 1000) return relative.format("ddd, HH:mm");
    if (relative.isSame(now, "y")) return relative.format("DD.MM HH:mm");
    return relative.format("DD.MM.YYYY HH:mm:ss");
  },
  full: utc => {
    const relative = moment.unix(utc / 1000);
    return relative.format("DD.MM.YYYY HH:mm:ss");
  },
};

export default DateFormatter;
