// Google sheet npm package
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// File handling package
import fs from "fs";
import { request } from "http";

// spreadsheet key is the long id in the sheets URL
const RESPONSES_SHEET_ID = "1W1A87swNCtM9O8yIioWLQAOa_Vdl7XxuhSou_Pgh81g";

// Credentials for the service account
const CREDENTIALS = JSON.parse(
  fs.readFileSync("mystic-berm-404114-f27cc40b5a1c.json")
);

const serviceAccountAuth = new JWT({
  // env var values here are copied from service account credentials generated by google
  // see "Authentication" section in docs for more info
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || CREDENTIALS.client_email,
  key: process.env.GOOGLE_PRIVATE_KEY || CREDENTIALS.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Create a new document
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID, serviceAccountAuth);

export const getGoogleSheetData = async function (req, res) {
  await doc.loadInfo();
  let sheet = doc.sheetsByIndex[0];

  const rowsValues = await sheet.getRows();

  const values = rowsValues.map((item) => {
    return { email: item._rawData[0], user_name: item._rawData[1] };
  });
  console.log(values);
  res.status(200).send(values);
};

export const addGoogleSheetData = async function (req, res) {
  // let data = {
  //   user_name: "Sergey Brin",
  //   email: "sergey@google.com",
  //   password: "Sergey123",
  // };

  // const { user_name, email, password } = req.body;
  const {
    PhysicianID,
    PatientID,
    first_name,
    last_name,
    Location,
    Age,
    Gender,
    Phone,
    Address,
    Dose,
    Prescription,
    Visit_Date,
    Next_Visit,
    Physician_first_name,
    Physician_last_name,
    Physician_Number,
    Bill
} = req.body

  await doc.loadInfo();
  let appointment = doc.sheetsByIndex[0];
  let prescribes = doc.sheetsByIndex[1];
  let patient = doc.sheetsByIndex[2];
  let phisician = doc.sheetsByIndex[3];
  let medication = doc.sheetsByIndex[4];
  // const newSheet = await doc.addSheet({ title: 'patients' });

  await appointment.setHeaderRow(["appointmentID", "patientID", "physicianID","start_dt_time","next_dt_time"]);
  await prescribes.setHeaderRow(["physician", "PatientID", "description","dose"]);
  await patient.setHeaderRow(["ssn", "first_name", "last_name","address","location","email","phone","pcp"]);
  await phisician.setHeaderRow(["employeeid", "name", "position","phone"]);
  // await medication.setHeaderRow(["email", "user_name", "password"]);
  let appointmentRows = await appointment.getRows();

  let appId 

  if(appointmentRows[appointmentRows.length-1]._rowNumber <10){
    appId =`emp000${appointmentRows[appointmentRows.length-1]._rowNumber}`
  }else if(appointmentRows[appointmentRows.length-1]._rowNumber<100){
    appId =`emp00${appointmentRows[appointmentRows.length-1]._rowNumber}`
  }else if(appointmentRows[appointmentRows.length-1]._rowNumber < 1000){
    appId =`emp0${appointmentRows[appointmentRows.length-1]._rowNumber}`
  }else {
    appId = `emp${appointmentRows[appointmentRows.length-1]._rowNumber}`
  }

  console.log(appointmentRows[appointmentRows.length-1],appId);
  await appointment.addRow({ appointmentID:appId ,"patientID":PatientID,"physicianID" :PhysicianID, "start_dt_time":Visit_Date,"next_dt_time":Next_Visit });
  await prescribes.addRow({"physician":PhysicianID,"PatientID":PatientID,"description":Prescription,"dose":Dose,Bill})
  await patient.addRow({ "ssn":"a12kj345","first_name":first_name,"last_name":last_name,"address":Address,"location":Location,"age":Age,"gender":Gender,"phone":Phone });
  await phisician.addRow({"employeeid":PhysicianID,"name":Physician_first_name,"position":"Sr Doctor","phone":Physician_Number})
  // await medication.addRow({ email, user_name, password });
  res.status(200).send({
    msg: "data added sucessfully",
    data: { ...req.body},
  });
};

export const updateGoogleSheetData = async function (req, res) {
  const { keyval, oldData, newData } = req.body;

  try {
    await doc.loadInfo();

    // Index of the sheet
    let sheet = doc.sheetsByIndex[0];

    let rows = await sheet.getRows();

    for (let index = 0; index < rows.length; index++) {
      console.log("inside for", rows[index]._rawData[0]);
      if (rows[index]._rawData[0] === oldData) {
        console.log("inside if");
        // rows[index] = newData;
        rows[index].assign({
          user_name: newData.user_name,
          email: newData.email,
          password: newData.password,
        });
        await rows[index].save(); // save updates on a row
        // rows[index].set('user_name') = newData.user_name;
        // rows[index].set('email') = newData.email;
        // rows[index].set('password') = newData.password;
      }
    }

    res.status(200).send({ msg: "data updated sucessfully", data: newData });
  } catch (error) {
    throw new Error(error);
  }
};

export const deleteGoogleSheetData = async function (req, res) {
  const { key, value } = req.body;

  await doc.loadInfo();

  // Index of the sheet
  let sheet = doc.sheetsByIndex[0];

  let rows = await sheet.getRows();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (rows[index]._rawData[0] === value) {
      await rows[index].delete();
      break;
    }
  }
  res.status(200).send({ msg: `data deleted sucessfully`, data: value });
};

const getRow = async (email) => {
  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });

  // load the documents info
  await doc.loadInfo();

  // Index of the sheet
  let sheet = doc.sheetsByIndex[0];

  // Get all the rows
  let rows = await sheet.getRows();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.email == email) {
      console.log(row.user_name);
      console.log(row.password);
    }
  }
};

// getRow('email@gmail.com');

const addRow = async (rows) => {
  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });

  await doc.loadInfo();

  // Index of the sheet
  let sheet = doc.sheetsByIndex[0];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    await sheet.addRow(row);
  }
};

let rows = [
  {
    email: "email@email.com",
    user_name: "ramesh",
    password: "abcd@1234",
  },
  {
    email: "email@gmail.com",
    user_name: "dilip",
    password: "abcd@1234",
  },
];

// addRow(rows);

const updateRow = async (keyValue, oldValue, newValue) => {
  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });

  await doc.loadInfo();

  // Index of the sheet
  let sheet = doc.sheetsByIndex[0];

  let rows = await sheet.getRows();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row[keyValue] === oldValue) {
      rows[index][keyValue] = newValue;
      await rows[index].save();
      break;
    }
  }
};

// updateRow('email', 'email@gmail.com', 'ramesh@ramesh.com')

const deleteRow = async (keyValue, thisValue) => {
  // use service account creds
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });

  await doc.loadInfo();

  // Index of the sheet
  let sheet = doc.sheetsByIndex[0];

  let rows = await sheet.getRows();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row[keyValue] === thisValue) {
      await rows[index].delete();
      break;
    }
  }
};

// deleteRow("email", "ramesh@ramesh.com");
