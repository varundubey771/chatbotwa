//========================================================================================
/*                                                                                      *
 *                                Import all dependencies                               *
 *                                                                                      */
//========================================================================================
const BotReply = require("../Helpers/chatbotCon");
const { insertOne, incrementCounter } = require("../Helpers/queryHandler");
//const client = require('twilio')("api key","pass");
//########################################################################################

module.exports = async (req, res) => {
  try {
    const { data } = res.locals;
    // console.log(data)
    const Result = await BotReply(req.body.MSG, "newagent-bocquu", data._id);
    if (Result.intent.displayName === "policebot_emergency") {
      res.status(200).send({ emergency: true });
      return;
    }
    // get all the values here if the intent is the end intent
    if (
      Result.intent.displayName === "fullwithsuspects.confirm.yes" ||
      Result.intent.displayName === "fullwithoutsuspects.confirm.yes"
    ) {
      // in the locals we have the jwt data decode with all the details

      const date = Result.parameters.fields.date.stringValue;

      const crime = Result.parameters.fields.CrimeType.stringValue;

      const personObj = Result.parameters.fields.person.listValue.values || [];

      const details = Result.parameters.fields.details.stringValue || "";

      let personArr = [];

      // console.log(Result.parameters.fields.details)
      // console.log(personObj)
      personObj.forEach((personData) => {
        // console.log(personData)

        personArr.push(personData.stringValue);
      });

      // get the case number from the mongodb database

      const caseNo = await incrementCounter();

      console.log(data, details, personArr);

      await insertOne("crimeRegister", {
        name: data.name,
        number: data.phone.toString(),
        date,
        crime,
        personArr,
        details,
        city: data.city,
        caseNo,
        status: "pending",
        investigatingOfficer: "none",
      });
      var msgBody = "";
      if (personArr.length > 0) {
        const suspects = personArr.map((item) => item);
        msgBody =
          "Your Report has been Registered\nCase Number: " +
          caseNo +
          "\nCrime: " +
          crime +
          "\nSuspects: " +
          suspects +
          "\nDescription: " +
          details;
      } else
        msgBody =
          "Your Report has been Registered\nCase Number: " +
          caseNo +
          "\nCrime: " +
          crime +
          "\nDescription: " +
          details;
      {
        // client.messages.create({

        //   from: 'whatsapp:+14155238886',

        //   to:'whatsapp:+91'+data.phone.toString(),

        //   body: msgBody

        // })

        res.status(201).send({ reply: "Crime registered case No - " + caseNo });
      }
    } else {
      if (Result.fulfillmentText.includes(";")) {
        var regex = /;/gi,
          result,
          indices = [];
        while ((result = regex.exec(Result.fulfillmentText))) {
          indices.push(result.index);
        }
        let date = Result.fulfillmentText.slice(indices[0] + 1, indices[1]);
        date = new Date(date);
        console.log(date > new Date());
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const reply = `${Result.fulfillmentText.slice(0, indices[0])}${day}-${
          month + 1
        }-${year} ${Result.fulfillmentText.slice(indices[1] + 1)}`;
        res.status(200).send({ reply });
        return;
      }
      res.status(200).send({ reply: Result.fulfillmentText });
    }
  } catch (error) {
    console.log(error);
    res.status(200).send({ reply: "I have expereinced an error sorry" });
  }
};
