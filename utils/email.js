const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log("error", error);
    } else {
      console.log("ready to message");
    }
  });
  //2) Define teh email options

  const mailOptions = {
    to: options.email,
    subject: options.subject,
    html: options.message,
    from: "repsandWeight@yandex.ru",
  };
  //3) send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
