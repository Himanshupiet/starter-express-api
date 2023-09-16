const { Securitylog } = require("../../models/securitylog");

module.exports = {
    sendDailyBackupEmail: async (req, res) => {
    try {
      let today = new Date(todayIndiaDate);
      let dd = String(today.getDate()).padStart(2, '0');
      let mm = String(today.getMonth() + 1).padStart(2, '0'); 
      let yyyy = today.getFullYear();
      today = dd + '/' + mm + '/' + yyyy;
      console.log("todaytoday", today)
      const userData = await roleModel.find()
      const userData2 = await roleModel.find()
      const text= JSON.stringify(userData)
      const text2= JSON.stringify(userData2)

      zip.file("user.json", text);
      zip.file("user2.json", text2);
      const buffer = await zip.generateAsync({ type: `nodebuffer` })

      if(buffer){
          const info = await transporter.sendMail({
              from: `"Daily Backup ${today}"   <info@bmmschool.in>`, // sender address
              to: "hkc.kumar@gmail.com",//"bmmsbkg@gmail.com", // list of receivers
              subject: `Daily Backup ${today}`, // Subject line
              text: "Find atachment", // plain text body
              html: "<b>BM Memorial School</b>", // html body
              attachments: [
              {   
                  filename: `Daily_${today}.zip`,
                  content:  buffer
              },
              ],
          });
          console.log("hhhhhhhhhhhhhhhhhh",JSON.stringify(info, null, 2))
          if(info.accepted){
            console.log("Daily Backup Mail send.")

          }else{
            console.log("Daily Backup Mail not send.")

          }
          
          // hhhhhhhhhhhhhhhhhh {
          //   "accepted": [
          //     "bmmsbkg@gmail.com"
          //   ],
          //   "rejected": [],
          //   "ehlo": [
          //     "PIPELINING",
          //     "8BITMIME",
          //     "AUTH LOGIN PLAIN CRAM-MD5"
          //   ],
          //   "envelopeTime": 131,
          //   "messageTime": 75,
          //   "messageSize": 3799,
          //   "response": "250 Message queued as <b317022a-32f2-e8cb-8740-f203bac5caf6@bmmschool.in>",
          //   "envelope": {
          //     "from": "info@bmmschool.in",
          //     "to": [
          //       "bmmsbkg@gmail.com"
          //     ]
          //   },
          //   "messageId": "<b317022a-32f2-e8cb-8740-f203bac5caf6@bmmschool.in>"
          // }
          
      }
    
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
        error: err.message,
      });
    }
  },
};