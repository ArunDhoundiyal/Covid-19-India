const express = require("express");
const server_instance = express();
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "covid19India.db");
server_instance.use(express.json());
let dataBase = null;
const initialize_DataBase_and_Server = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    server_instance.listen(3000, () => {
      console.log("sever is running on http/localhost:3000/");
    });
  } catch (error) {
    console.log(`DataBase Error ${error.message}`);
    process.exit(1);
  }
};

const change_State_snake_case_into_camelCase = (allStateArray) => {
  return {
    stateId: allStateArray.state_id,
    stateName: allStateArray.state_name,
    population: allStateArray.population,
  };
};

const change_District_snake_case_into_camelCase = (oneDistrictData) => {
  return {
    districtId: oneDistrictData.district_id,
    districtName: oneDistrictData.district_name,
    stateId: oneDistrictData.state_id,
    cases: oneDistrictData.cases,
    cured: oneDistrictData.cured,
    active: oneDistrictData.active,
    deaths: oneDistrictData.deaths,
  };
};

initialize_DataBase_and_Server();

// GET API 1 (Fetch details of state)
server_instance.get("/states/", async (request, response) => {
  const getDetailsOf_states = `SELECT * 
    FROM state;`;
  const getAllInfoOf_state = await dataBase.all(getDetailsOf_states);
  console.log(getAllInfoOf_state);
  response.send(
    getAllInfoOf_state.map((statesArray) =>
      change_State_snake_case_into_camelCase(statesArray)
    )
  );
});

// GET API 2 (Fetch details of AnyOne State)
server_instance.get(`/states/:stateId/`, async (request, response) => {
  const { stateId } = request.params;
  const getDetailOf_oneState = `SELECT * 
    FROM state WHERE state_id = '${stateId}';`;
  const getOneStateInfo = await dataBase.get(getDetailOf_oneState);
  response.send(change_State_snake_case_into_camelCase(getOneStateInfo));
});

// POST API 3 (Create data of AnyOne District)
server_instance.post(`/districts/`, async (request, response) => {
  const request_body = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = request_body;
  const create_DistrictData = `INSERT INTO district (district_name, 
state_id,     
cases,       
cured,       
active,        
deaths)
VALUES 
('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}' );`;
  const add_district_Data = await dataBase.run(create_DistrictData);
  response.send("District Successfully Added");
});

module.exports = server_instance;

//GET API 4 (Get Details of AnyOne District)
server_instance.get(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const getOneDistrictData = `SELECT * FROM district WHERE district_id = '${districtId}';`;
  const oneDistrictData = await dataBase.get(getOneDistrictData);
  console.log(oneDistrictData);
  response.send(change_District_snake_case_into_camelCase(oneDistrictData));
});

// DELETE API 5 (Delete Details of AnyOne API from District)
server_instance.delete(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const removeOneDistrictAPI = `SELECT * FROM district WHERE district_id = '${districtId}';`;
  const removeOneDistrictData = await dataBase.run(removeOneDistrictAPI);
  response.send("District Removed");
});

// PUT API 6 (Update Details of AnyOne API from District)
server_instance.put(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const request_body = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = request_body;
  const update_district_data = `UPDATE district 
    SET
     district_name = '${districtName}',
     state_id = '${stateId}',
     cases = '${cases}',
     cured = '${cured}',
     active = '${active}',
     deaths = '${deaths}'
     WHERE 
     district_id = ${districtId};`;
  await dataBase.run(update_district_data);
  response.send("District Details Updated");
});

//GET API 7 (Get Total Details)
server_instance.get(`/states/:stateId/stats/`, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT  
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district WHERE state_id = ${stateId};`;
  const StateQuery = await dataBase.get(getStateQuery);
  console.log(StateQuery);Covid-19 India
  response.send({
    totalCases: StateQuery["SUM(cases)"],
    totalCured: StateQuery["SUM(cured)"],
    totalActive: StateQuery["SUM(active)"],
    totalDeaths: StateQuery["SUM(deaths)"],
  });
});

//GET API 8 (Get Detail of AnyOne state name from District)
server_instance.get(
  `/districts/:districtId/details/`,
  async (request, response) => {
    const { districtId } = request.params;
    const getState_id_from_districts = `SELECT state_id 
  FROM district WHERE  district_id = ${districtId};`;
    const districtIDinDistrictTable = await dataBase.get(
      getState_id_from_districts
    );
    const getStateName = `SELECT state_name AS stateName
  FROM state WHERE state_id = ${districtIDinDistrictTable.state_id};`;
    const getStateNameAsResponse = await dataBase.get(getStateName);
    response.send(getStateNameAsResponse);
  }
);
