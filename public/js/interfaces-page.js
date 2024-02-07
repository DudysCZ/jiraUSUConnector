AP.context.getToken(function(token){
    // get environmental URL setting
    var envURL = document.getElementById('hidden-env').innerHTML;
    $("#interface-select").auiSelect2({
        placeholder: "Select an interface"
    });

    /*SHOW THE DELETE INTERFACE FLAG*/
    document.getElementById('interface-delete-button').onclick = function(e) {
        e.preventDefault();

        const interfaceId = document.getElementById("interface-select").value;
          
        if (interfaceId !== "") {
            var interfaceName = $("#interface-select option:selected" ).text();
            var deleteInterfaceFlag = AJS.flag({
                type: 'error',
                title: interfaceName,
                body: '<div class="field-group">' +
                      '<p id="delete-confirm-p-cfj" >Are you sure you want to delete this interface?</p>' +
                      '</div>' +
                      '<div class="field-group aui-buttons">' +
                      '<button class="aui-button aui-button-primary deleteflagbuttons-cfj" id="confirm-delete-interface" type="button">Confirm</button>' +
                      '<button class="aui-button aui-button-subtle" id="cancel-delete-interface">Cancel</button></div>',
                close: 'manual',
            });
            deleteInterfaceFlag.setAttribute('id', "delete-interface-flag");
    
            /*DELETE THE DELETE INTERFACE FLAG*/
            document.getElementById('cancel-delete-interface').onclick = function(e) {
                e.preventDefault();
                var deleteLogFlag = document.getElementById("delete-interface-flag");
                deleteLogFlag.close();
            };
    
            /*DELETE THE INTERFACE BY ITS FLAG*/
            document.getElementById('confirm-delete-interface').onclick = function(e) {
                e.preventDefault();
                
                const interfaceId = document.getElementById("interface-select").value;
                var deleteInterfaceFlag = document.getElementById("delete-interface-flag");
    
                var xhr = new XMLHttpRequest();
                    xhr.open('DELETE', envURL + "api/v1/interfaces/" + interfaceId, true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "JWT " + token);
    
                    xhr.onload = function () {
                        if (xhr.readyState === xhr.DONE) { // if complete
                            if (xhr.status === 200) {
                                //delete the record from the select element and trigger the change
                                $("#interface-select option[value='" + interfaceId + "']").remove();
                                $('#interface-select').val(null).trigger('change');

                                deleteInterfaceFlag.close();
                                showFlag('success','','Interface has been successfully deleted.','auto');
                                $("a[href$='#tabs-interfaces']").click();
                            }
                            else if (xhr.status === 401) {
                                showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                            }
                            else {
                                var serverResponse = JSON.parse(this.responseText);
                                showFlag('warning','',"Deleting process has failed. " + serverResponse.message,'manual');
                            }
                        }
                    };
                    xhr.onerror = function () {
                        showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                        console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
                    };
    
                    xhr.send();
            }
        }
        else {
            showFlag('warning', '', 'Please select your interface.','manual');
        }
    };

    // CREATE NEW INTERFACE
    document.getElementById('interface-add-button').onclick = function(e) {
        e.preventDefault();

        var xhr = new XMLHttpRequest();
            xhr.open('POST', envURL + "api/v1/interfaces", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    if (xhr.status === 200) {
                        var newInterface = JSON.parse(this.responseText);

                        var data = {
                            id: newInterface.id,
                            text: newInterface.Name
                        };
                        
                        var newOption = new Option(data.text, data.id, false, false);
                        newOption.selected = true;
                        $('#interface-select').append(newOption).trigger('change');
                        showFlag('success','','New interface has been successfully created.','auto');
                    }
                    else if (xhr.status === 401) {
                        showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','','New interface creating process has failed. ' + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send();
    }

    /* CHANGE INTERFACE */ 
    document.getElementById('interface-select').onchange = function(e) {
        e.preventDefault(e);
        
        const interfaceId = this.value;
        if (interfaceId !== "") {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', envURL + "api/v1/interfaces/"+ interfaceId, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    if (xhr.status === 200) {
                        const getInterface = JSON.parse(this.responseText);
                        $("#Name-text-input").val(getInterface.Name);
                        $("#Servicename-text-input").val(getInterface.ServiceName);
                        $("#Username-text-input").val(getInterface.UserName);
                        $("#URL-text-input").val(getInterface.URL);
                        $("#AccessToken-text-input").val(getInterface.AccessToken);
                        $("#CryptedPassword-text-input").val(getInterface.CryptedPassword);
                        $("#ACID-text-input").val(getInterface.AccountID);
                        $("#InterfaceKey-text-input").val(getInterface.InterfaceKey);
                        $("#Client-text-input").val(getInterface.Client);

                        $("#OACID-text-input").val(getInterface.oauthcredential.OAClientID);
                        $("#OAS-text-input").val(getInterface.oauthcredential.OASecret);

                        $("#ExUsername-text-input").val(getInterface.basicauthcredential.ExternalUsername);
                        $("#ExToken-text-input").val(getInterface.basicauthcredential.ExternalUsernameToken);

                        $(".webhookPath").text(getInterface.InterfaceKey);
                        $("a[href$='#tabs-interfaces']").click();
                        
                    }
                    else if (xhr.status === 401) {
                        showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','',"Getting the interface data failed. " + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send();
        }
        else {
            //clear everything
            $('#adminform')[0].reset();
            $('#OauthForm')[0].reset();
            $('#Basic-AuthForm')[0].reset();
            $(".webhookPath").text("");
        }
    };

    document.getElementById('copy-api-token-button').onclick = function(e) {
        e.preventDefault();

          var copyText = document.getElementById("ExToken-text-input");

        /*ADJUST IT FOR TYPE PASSWORD*/
        var x = document.createElement("INPUT");
          x.setAttribute("type", "text");
          x.setAttribute("value", copyText.value);
          document.body.appendChild(x);
          x.select();
          document.execCommand("copy");
          x.remove();

        showFlag('success','','Copied!','auto');
    }

    document.getElementById('getAuthInfoLink').onclick = function(e) {
        e.preventDefault();
        window.open("https://developer.atlassian.com/console/", "_blank");
    }

    /*TEST JIRA CONNECTION*/ 
    document.getElementById('jira-connection-button').onclick = function(e) {
        e.preventDefault();

        const interfaceId = document.getElementById("interface-select").value;
        if (interfaceId !== "") {
            
            var testFlag = AP.flag.create({
                type: 'info',
                title: 'Jira Connection testing',
                body: '...',
                close: 'never'
            });

            var xhr = new XMLHttpRequest();
            xhr.open('GET', envURL + "api/v1/connection/jira-connection/" + interfaceId, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    testFlag.close();
                    if (xhr.status === 200) {
                        showFlag('success','','Jira connection test successful.','auto');
                    }
                    else if (xhr.status === 401) {
                        try {
                            var serverResponse = JSON.parse(this.responseText);
                            showFlag('warning','', "Jira connection test failed. " +  serverResponse.message,'manual');
                        } 
                        catch(err) {
                            //there's no json object coming back from backend
                            showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                        }
                    }
                    else if (xhr.status === 403) {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','', serverResponse.message,'manual');
                    }
                    else if (xhr.status === 503) {
                        showFlag('warning','','Jira connection test failed. Service Unavailable.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','','Jira connection test failed. ' + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                testFlag.close();
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send();
        }
        else {
            showFlag('warning', '', 'Please select your interface to test Jira Connection.','manual');
        }
            

    };

    /*REGISTER DYNAMIC WEBHOOKS*/ 
    document.getElementById('create-webhooks').onclick = function(e) {
        e.preventDefault();

        const interfaceId = document.getElementById("interface-select").value;

        if (interfaceId !== "") {
            const checkboxes = document.querySelectorAll('input[name="event"]:checked');
            let events = [];
            checkboxes.forEach((checkbox) => {
                events.push(checkbox.value);
            });
    
            var jqlFilter = document.getElementById("whJQL-text-input").value;
            var jsonToSend = new Object();
                jsonToSend.jqlFilter = jqlFilter;
                jsonToSend.events = events;
                jsonToSend.interfaceId = interfaceId;
                
            var xhr = new XMLHttpRequest();
                xhr.open('POST', envURL + "api/v1/app-webhooks", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization", "JWT " + token);
    
                xhr.onload = function () {
                    if (xhr.readyState === xhr.DONE) { // if complete
                        if (xhr.status === 200) {
                            var response = JSON.parse(this.responseText);
                            if (response.webhookRegistrationResult[0].hasOwnProperty("errors")) {
                                showFlag('warning','',response["webhookRegistrationResult"][0]["errors"][0],'manual');
                            }
                            else {
                                showFlag('success','','Webhook was successfully crated.','auto');
                                //Refresh Page                                
                                $("a[href$='#tabs-webhooks']").click();
                            }
                        }
                        else if (xhr.status === 401) {
                            showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                        }
                        else if(xhr.status === 400) {
                            showFlag('warning','','Atlassian error: Invalid request.','manual');        
                        }
                        else {
                            var serverResponse = JSON.parse(this.responseText);
                            showFlag('warning','','Webhook creating process has failed. ' + serverResponse.message,'manual');
                        }       
                    }
                };
                xhr.onerror = function () {
                    showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                    console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
                };
    
                xhr.send(JSON.stringify(jsonToSend));
        }
        
        else {
            showFlag('warning', '', 'Please select your interface.','manual');
        }
    }

    /*CHANGE WEBHOOK STATUS*/ 
    $(document).on("click",".togglesWH",function(e){
        e.preventDefault();
        
        const interfaceId = document.getElementById("interface-select").value;
        const whId = $(this).val();
         
        var toggleID = "whStatus_" + whId;
        var toggle = document.getElementById(toggleID);
        var isChecked = toggle.checked;     // new value of the toggle
       
        var jsonToSend = new Object();
            jsonToSend.interfaceId = interfaceId;
            jsonToSend.id = whId;
            jsonToSend.status = isChecked;

        var xhr = new XMLHttpRequest();
            xhr.open('PUT', envURL + "api/v1/app-webhooks/status", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function (response) {
                if (xhr.status === 204) {
                   console.log("Webhook status was changed.");
                }
                else if (xhr.status === 401) {
                    showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                }
                else {
                    var serverResponse = JSON.parse(this.responseText);
                    showFlag('warning','','Changing status process has failed. ' + serverResponse.message,'manual');
                }
            };
            xhr.onerror = function () {
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send(JSON.stringify(jsonToSend)); //stringfy - to make the object to be in json format
            
        
    });

    /*CLICK ON WEBHOOK TAB*/
    document.getElementById('aui-uid-3').onclick = function(e) {
        e.preventDefault();

        document.getElementById("wht-body-cfj").innerHTML = ""; //clean the webhook space
        const interfaceId = document.getElementById("interface-select").value;

        if (interfaceId !== "") {

            var searchDiv = document.getElementById('search-wh-div');
                searchDiv.style.display = "flex";

            var xhr = new XMLHttpRequest();
            xhr.open('GET', envURL + "api/v1/app-webhooks/" + interfaceId, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    
                    if (xhr.status === 200) {
                        var response = JSON.parse(this.responseText);
                        response = JSON.parse(response);
                        var results = "";
                        var d1 = new Date(); // today's date
                        var refreshButton = "";
                        var toggleButton = "";
                        $.each(response, function(i, obj) {     
                            var d2 = new Date(obj.expirationDate);
                            if(d1.getTime() > d2.getTime()){
                                // today's date1 is newer
                                // color button to red 
                                refreshButton = '<button onclick="whRefresh(this)" class="aui-button refresh-invalid-button" type="button" value="' + obj.id + '">Refresh</button>'
                            }
                            else {
                                refreshButton = '<button onclick="whRefresh(this)" class="aui-button refresh-valid-button" type="button" value="' + obj.id + '">Refresh</button>'
                            }
                            if (obj.status === true ) {
                                toggleButton = '<aui-toggle checked class="togglesWH" id="whStatus_' + obj.id + '" label="WebHook status" value="' + obj.id + '"></aui-toggle>';
                            }
                            else {
                                toggleButton = '<aui-toggle class="togglesWH" id="whStatus_' + obj.id + '" label="WebHook status" value="' + obj.id + '"></aui-toggle>';
                            }
                            results+=  "<tr>" +
                                "<td>" + parseInt(i+1) + "</td>" +
                                "<td>" + obj.jqlFilter + "</td>" +
                                "<td>" + obj.events + "</td>" +
                                "<td>" + obj.expirationDate + "</td>" +
                                "<td>" + toggleButton + "</td>" +
                                '<td>' + refreshButton + 
                                '<button onclick="whDelete(this)"class="aui-button aui-button-link" type="button" value="' + obj.id + '">Delete</button>' +
                                '</td>' +
                                "</tr>";
                        });
                        searchDiv.style.display = "none";
                        document.getElementById("wht-body-cfj").innerHTML = results;
                    }
                    else if (xhr.status === 401) {
                        showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','','Getting webhooks process has failed. ' + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                gettingFlag.close();
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send();
        }
        else {
            showFlag('warning', '', 'Please select your interface.','manual');
        }

        
    }

    document.getElementById('accountId-button').onclick = function(e) {
        e.preventDefault();
        AP.request('/rest/api/3/myself', {
            success: function(responseText){
                var accountId = JSON.parse(responseText).accountId;
                var ac_id_el = document.getElementById('ACID-text-input');
                    ac_id_el.value = accountId;
            }
        });
    }

    //SAVE INTERFACE SETTINGS
    document.getElementById('save_settings_button').onclick = function(e) {
        e.preventDefault();
        //Validate Form
        if ($("#adminform")[0].reportValidity() == true) { // IE does NOT support it
            const interfaceId = document.getElementById("interface-select").value;
          
            if (interfaceId !== "") {
                var name = document.getElementById("Name-text-input").value;
                    service = document.getElementById("Servicename-text-input").value;
                    username = document.getElementById("Username-text-input").value;
                    url = document.getElementById("URL-text-input").value;
                    accessToken = document.getElementById("AccessToken-text-input").value;
                    password = document.getElementById("CryptedPassword-text-input").value;
                    client = document.getElementById("Client-text-input").value;
                    accountId = document.getElementById("ACID-text-input").value;
                    interfaceKey = document.getElementById("InterfaceKey-text-input").value;

                var jsonToSend = new Object();
                    jsonToSend.name = name;
                    jsonToSend.service = service;
                    jsonToSend.username = username;
                    jsonToSend.url = url;
                    jsonToSend.accessToken = accessToken;
                    jsonToSend.password = password;
                    jsonToSend.client = client;
                    jsonToSend.accountId = accountId;
                    jsonToSend.interfaceKey = interfaceKey;

                var xhr = new XMLHttpRequest();
                    xhr.open('PUT', envURL + "api/v1/interfaces/" + interfaceId, true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "JWT " + token);

                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            showFlag('success', '', 'Configuration saved.','auto');
                            var updatedInterface = JSON.parse(this.responseText);
                            $("#interface-select option[value='" + updatedInterface.id + "']").remove();
                            var newOption = new Option(updatedInterface.Name, updatedInterface.id, false, false);
                            newOption.selected = true;
                            $('#interface-select').append(newOption).trigger('change');
                        }
                        else if (xhr.status === 401) {
                            showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                        }
                        else {
                            var serverResponse = JSON.parse(this.responseText);
                            showFlag('warning','','Configuration saving process has failed .' + serverResponse.message,'manual');
                        }
                    };
                    xhr.onerror = function () {
                        showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                    };

                    xhr.send(JSON.stringify(jsonToSend)); //stringfy - to make the object to be in json format
            }
            else {
                showFlag('warning', '', 'Please select your interface to save the settings.','manual');
            }
        }

    };

    /* TEST USU CONNECTION */
    document.getElementById('connection-button').onclick = function(e) {
        e.preventDefault();
        const interfaceId = document.getElementById("interface-select").value;

        if (interfaceId !== "") {
            var testFlag = AP.flag.create({
                type: 'info',
                title: 'USU Connection testing',
                body: '...',
                close: 'never'
            });
    
            var xhr = new XMLHttpRequest();
                xhr.open('GET', envURL + "api/v1/connection/usu-connection/" + interfaceId, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization", "JWT " + token);
    
                xhr.onload = function () {
                    if (xhr.readyState === xhr.DONE) { // if complete
                        testFlag.close();
    
                            if (xhr.status === 200) {
                                var response = JSON.parse(this.responseText);
                                response = JSON.parse(response);
                                if (response['returnCode'] === "00") {
                                    showFlag('success','','Connection test successful.','auto');        
                                }
                                else {
                                    showFlag('warning','','Cconnection test wasn\'t successful.','auto');        
                                }                
                            }
                            else if (xhr.status === 401) {
                                showFlag('warning','','App authentication request has expired. Try reloading the page.','manual');
                            }
                            else {
                                var serverResponse = JSON.parse(this.responseText);
                                showFlag('warning','','Connection test failed.  ' + serverResponse.message,'manual');
                            }
                    }
                };
                xhr.onerror = function () {
                    testFlag.close();
                    showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                    console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
                };
    
                xhr.send();
        }
        else {
            showFlag('warning', '', 'Please select your interface.','manual');
        } 
    };

    //SAVE OAUTH AUTHORIZATION
    document.getElementById("auth-button").onclick = function (e) {
        e.preventDefault();
        if ($("#OauthForm")[0].reportValidity() == true) { // IE does NOT support it
            const interfaceId = document.getElementById("interface-select").value;
            if (interfaceId !== "") {
                var oacid = document.getElementById("OACID-text-input").value;
                    oas = document.getElementById("OAS-text-input").value;
                    oaurl = document.getElementById("OAURL-input").value;

                var jsonToSend = new Object();
                    jsonToSend.oaclientid = oacid;
                    jsonToSend.oasecret = oas;
                    jsonToSend.oaurl = oaurl;
                    jsonToSend.interfaceId = interfaceId;

                var xhr = new XMLHttpRequest();
                    xhr.open('PUT', envURL + "api/v1/oauth2/credential", true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "JWT " + token);

                    xhr.onload = function () {
                        if (xhr.readyState === xhr.DONE) { // if complete
                                if ((xhr.status === 200)) {
                                    var text = document.getElementById('OAURLGEN-input');
                                    var div = document.getElementById('div-OAURLGEN');
                                    if (this.responseText !== "") {
                                        text.value = this.responseText;
                                        div.style.display = "inline-block";
                                    }
                                    showFlag('success','','Configuration saved.','auto');
                                }
                                else if (xhr.status === 401) {
                                    showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                                }
                                else {
                                    var serverResponse = JSON.parse(this.responseText);
                                    showFlag('warning','','Configuration saving process has failed. ' + serverResponse.message,'manual');
                                }
                        }
                    };
                    xhr.onerror = function () {
                        showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                        console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
                    };

                    xhr.send(JSON.stringify(jsonToSend));
            }
            else {
                showFlag('warning', '', 'Please select your interface.','manual');
            } 
        }

    };

    /* SAVE BASIC AUTHORIZATION */
    document.getElementById('auth-basic-button').onclick = function(e) {
        e.preventDefault();
        //Validate Form
        if ($("#Basic-AuthForm")[0].reportValidity() == true) { // IE does NOT support it
            const interfaceId = document.getElementById("interface-select").value;
            
            if (interfaceId !== "") {
                var cloudInstanceURL = document.getElementById("CloudURL-text-input").value;
                    externalUsername = document.getElementById("ExUsername-text-input").value;
                    externalToken = document.getElementById("ExToken-text-input").value;

                var jsonToSend = new Object();
                    jsonToSend.cloudURL = cloudInstanceURL;
                    jsonToSend.externalUsername = externalUsername;
                    jsonToSend.externalToken = externalToken;


                var xhr = new XMLHttpRequest();
                    xhr.open('PUT', envURL + "api/v1/basicauth/" + interfaceId, true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "JWT " + token);

                    xhr.onload = function (response) {
                        if (xhr.status === 204) {
                            showFlag('success', '', 'Configuration saved.','auto');
                        }
                        else if (xhr.status === 401) {
                            showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                        }
                        else {
                            var serverResponse = JSON.parse(this.responseText);
                            showFlag('warning','','Configuration saving process has failed. ' + serverResponse.message,'manual');
                        }
                    };
                    xhr.onerror = function () {
                        showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                        console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
                    };

                    xhr.send(JSON.stringify(jsonToSend)); //stringfy - to make the object to be in json format
            }
            else {
                showFlag('warning', '', 'Please select your interface.','manual');
            }
        }
    };

});

/* REFRESH DYNAMIC WEBHOOKS */
function whRefresh(objButton) {
    var id = objButton.value;
    // get environmental URL setting
    var envURL = document.getElementById('hidden-env').innerHTML;
    AP.context.getToken(function(token){
        var jsonToSend = new Object();
            jsonToSend.id = id;

        var xhr = new XMLHttpRequest();
            xhr.open('PUT', envURL + "api/v1/app-webhooks", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    if (xhr.status === 200) {
                        var response = JSON.parse(this.responseText);
                        showFlag('success','','Webhook has been refreshed to date: ' + response["expirationDate"] + '.','auto');
                        //Refresh Page
                        $("a[href$='#tabs-webhooks']").click();
                    }
                    else if (xhr.status === 401) {
                        showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                    }
                    else if (xhr.status === 400) {
                        showFlag('warning','','Atlassian eror: request is invalid.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','','Webhook refreshing process has failed. ' + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send(JSON.stringify(jsonToSend));
    });
};

/* DELETE DYNAMIC WEBHOOKS */
function whDelete(objButton) {
    const interfaceId = document.getElementById("interface-select").value;
    var webhookId = objButton.value;
    // get environmental URL setting
    var envURL = document.getElementById('hidden-env').innerHTML;
    AP.context.getToken(function(token){
        var jsonToSend = new Object();
            jsonToSend.id = webhookId;
            jsonToSend.interfaceId = interfaceId;

        var xhr = new XMLHttpRequest();
            xhr.open('DELETE', envURL + "api/v1/app-webhooks", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", "JWT " + token);

            xhr.onload = function () {
                if (xhr.readyState === xhr.DONE) { // if complete
                    if (xhr.status === 202) {
                        showFlag('success','','Webhook has been successfully deleted.','auto');
                        //Refresh Page
                        document.getElementById("aui-uid-3").click();
                        $("a[href$='#tabs-webhooks']").click();
                    }
                    else if (xhr.status === 401) {
                        showFlag('warning','','Addon authentication request has expired. Try reloading the page.','manual');
                    }
                    else if (xhr.status === 400) {
                        showFlag('warning','','Atlassian error: List of webhook IDs is missing.','manual');
                    }
                    else {
                        var serverResponse = JSON.parse(this.responseText);
                        showFlag('warning','','Webhook deleting process has failed. ' + serverResponse.message,'manual');
                    }
                }
            };
            xhr.onerror = function () {
                showFlag('warning', '', 'The connector is unable to reach the backend application. Please contact the administrators.','manual');
                console.log("An error occurred during the request. Details:\nStatus: " + textStatus + "\nerrorThrown(HTTP): " + errorThrown);
            };

            xhr.send(JSON.stringify(jsonToSend));

    });
};

function showFlag(mType, mTitle, mBody, mClose) {
    var flag = AP.flag.create({
      title: mTitle,
      body: mBody,
      type: mType,
      close: mClose
    });
}