export const maskPassword = (stringToMask) => {

    var jsonToMask = JSON.parse(stringToMask.body);

    if (jsonToMask.hasOwnProperty("password")) {
        jsonToMask.password =  "*****";
    }

    return JSON.stringify(jsonToMask);
}