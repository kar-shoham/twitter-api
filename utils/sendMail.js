import nodemailer from "nodemailer";

let sendMail = async(to, message, subject) => {
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
  console.log('Mail about to be sent')
  await transporter.sendMail(mailOptions);
};

export default sendMail;
