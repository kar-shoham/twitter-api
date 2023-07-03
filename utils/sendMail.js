import nodemailer from "nodemailer";

let sendMail = async (to, message, subject) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL, // sender address
    to, // list of receivers
    subject, // Subject line
    text: message, // plain text body
  };
  new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, response) {
      if (error) {
        reject(error);
      } else {
        resolve("email sent");
      }
    });
  });
};

export default sendMail;
