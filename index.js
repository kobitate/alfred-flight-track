require('dotenv').config()
const alfy = require("alfy");
const moment = require("moment");

const API_ROOT = "https://api.flightstats.com/flex/flightstatus/rest/v2/json";

let output = [];

const date = moment().format("YYYY/M/D");

const input = alfy.input;

let flightCarrier = input.match(/[A-Za-z]{2,3}/);
flightCarrier = flightCarrier ? flightCarrier[0] : false;
let flightNumber = input.replace(flightCarrier, "").replace(/ /, "");
let flightDirection = "arr";

const fetchFlight = `${API_ROOT}/flight/status/${flightCarrier}/${flightNumber}/${flightDirection}/${date}/?appId=${process.env.APP_ID}&appKey=${process.env.APP_KEY}`;
// const fetchFlight = "https://kobitate.com/flight.json"; 

// const status = {
//     A: "Active",
//     C: "Canceled",
//     D: "Diverted",
//     DN: "Unknown",
//     L: "Landed",
//     NO: "Not Operational",
//     R: "Redirected",
//     S: "Scheduled",
//     U: "Unknown"
// }

if (flightCarrier === false || flightNumber.length === 0) {
    alfy.output([{
        title: "Track a flight",
        subtitle: "Enter a flight number",
        icon: {
            path: "img/list-icon-base.png"
        }
    }]);
} else {
    alfy.fetch(fetchFlight).then(data => {
        const flights = data.flightStatuses;
        if (!flights || flights.length === 0) {
            alfy.output([{
                title: "Flight not found",
                subtitle: "Please try again",
                icon: {
                    path: "img/list-icon-error.png"
                }
            }]);
        } else {
            flights.forEach(flight => {
                const dep = flight.operationalTimes.actualGateDeparture ? moment.utc(flight.operationalTimes.actualGateDeparture.dateUtc) : "";
                const depSch = flight.operationalTimes.scheduledGateDeparture ? moment.utc(flight.operationalTimes.scheduledGateDeparture.dateUtc) : "";
                const arr = flight.operationalTimes.actualGateArrival ? moment.utc(flight.operationalTimes.actualGateArrival.dateUtc) : "";
                const arrSch = flight.operationalTimes.scheduledGateArrival ? moment.utc(flight.operationalTimes.scheduledGateArrival.dateUtc) : "";

                const flightCode = `${flight.carrierFsCode}${flight.flightNumber}`.toUpperCase();
                switch (flight.status) {
                    case "L": 
                        const diff = arr.diff(arrSch, "minutes");
                        output.push({
                            title: `Landed at ${arr.local().format("h:mm a")} ${diff !== 0 && `(${Math.abs(diff)} minutes ${diff < 0 ? "early" : "late"})`}`,
                            subtitle: `${flightCode} from ${flight.departureAirportFsCode} to ${flight.arrivalAirportFsCode}`, 
                            arg: flight.id,
                            icon: {
                                path: "img/list-icon-landed.png"
                            }
                        });
                        return;
                    case "S": 
                        output.push({
                            title: `Departs at ${depSch.local().format("h:mm a")} (${depSch.fromNow()})`,
                            subtitle: `${flightCode} from ${flight.departureAirportFsCode} to ${flight.arrivalAirportFsCode}`, 
                            arg: flight.id,
                            icon: {
                                path: "img/list-icon-scheduled.png"
                            }
                        });
                        return;
                    case "A": 
                        output.push({
                            title: `In-flight, Arrives at ${arrSch.local().format("h:mm a")} (${arrSch.fromNow()})`,
                            subtitle: `${flightCode} from ${flight.departureAirportFsCode} to ${flight.arrivalAirportFsCode}`, 
                            arg: flight.id,
                            icon: {
                                path: "img/list-icon-inflight.png"
                            }
                        });
                        return;
                    case "C": 
                        output.push({
                            title: `Canceled`,
                            subtitle: `${flightCode} from ${flight.departureAirportFsCode} to ${flight.arrivalAirportFsCode}`, 
                            arg: flight.id,
                            icon: {
                                path: "img/list-icon-canceled.png"
                            }
                        });
                        return;
                }
                
            })
            alfy.output(output);
        }
    });

}