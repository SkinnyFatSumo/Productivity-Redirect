
document.addEventListener("DOMContentLoaded", function() {

    // Store state of original "blocked" html for template
    var preserve_b = document.getElementById("blocked-sites").innerHTML;

    // Store state of originial "redirect" html for template
    var preserve_r = document.getElementById("redirect-sites").innerHTML;

    // Store "blocked" html subject to change, process into template 
    var html_b = document.getElementById("blocked-template").innerHTML;
    var template_b = Handlebars.compile(html_b);

    // Store "redirect" html subject to change, process into template 
    var html_r = document.getElementById("redirect-template").innerHTML;
    var template_r = Handlebars.compile(html_r);


    // Store blocking status button
    var button = document.getElementById("blocking_status");


    // Get all stored values for processing and generating
    chrome.storage.sync.get(["saved_filter", "saved_redirect", "saved_b_names", "saved_r_names", "saved_status"], function(result) {
        
        // Store filter and redirect sites locally
        var filter = result.saved_filter;
        var redirects = result.saved_redirect;
       
        // Store site names locally
        var b_names = result.saved_b_names;
        var r_names = result.saved_r_names;

        // Package filter site and name as object
        // Create list of these objects for passing to blocked sites template
        var b_data = {blocked: []};
        
        for (var i = 0; i < filter.urls.length; i++) {
            b_data.blocked.push(
                {
                    url: filter.urls[i],
                    name: b_names.sites[i]
                });
        }
        console.log("b_data", b_data);


        // Package redirect site and name as object
        // Create list of these objects for passing to redirect sites template
        var r_data = {redirected: []};

        for (var j = 0; j < redirects.redirects.length; j++) {
            r_data.redirected.push( 
                {
                    url: redirects.redirects[j],
                    name: r_names.sites[j]
                });
        } 
        console.log("r_data", r_data);   

        // Set block/unblock button to proper status 
        if (result.saved_status == "b_enabled") {
            button.innerHTML = "Disable Blocking";
            button.classList.add("blocking_status_enabled");
        } else if (result.saved_status == "b_disabled") {
            button.innerHTML = "Enable Blocking";
            button.classList.add("blocking_status_disabled");
        }

        // Update list of blocked and redirect sites with values from storage on page load
        document.getElementById("blocked-sites").innerHTML += template_b(b_data);
        document.getElementById("redirect-sites").innerHTML += template_r(r_data);


        // inject link to css page into html page
            // (workaround due to issues created by web filtering and manifest)
        document.head.insertAdjacentHTML("beforeend",
        "<link rel='stylesheet' type='text/css' href=" + 
               chrome.runtime.getURL('styles.css') + ">");

        
        // Create listener for clicks (on remove buttons) inside list of BLOCKED sites 
        var b_list_listen = document.getElementById("blocked-sites");
        b_list_listen.addEventListener("click", function(event) {

            // insure that a button was clicked 
                // otherwise clicking sites themselves would cause removal
            if (event.target.type == "button") {
                
                // Store list element id (index) of item where button was clicked
                var item_id_b = event.target.id;

                // Get blocked sites list from storage, cut out removed site based on index
                // Then update list 
                chrome.storage.sync.get(["saved_filter", "saved_b_names"], function(results) {
                    var rem_update_b = results.saved_filter.urls;
                    var rem_update_b_names = results.saved_b_names.sites;

                    rem_update_b.splice(item_id_b, 1);
                    rem_update_b_names.splice(item_id_b, 1);

                    chrome.storage.sync.set({"saved_filter": {urls: rem_update_b}, 
                                             "saved_b_names": {sites: rem_update_b_names}}, function() {
                        console.log("item removed");
                    });
                }); 
            }
        }); 


        // Create listener for clicks (on remove buttons) inside list of REDIRECT sites 
        var r_list_listen = document.getElementById("redirect-sites");
        r_list_listen.addEventListener("click", function(event) {

            // insure that a button was clicked
            if (event.target.type == "button") {
            
                // Store list element id (index) of item where button was clicked
                var item_id_r = event.target.id;
               
                // Get redirect sites list from storage, cut out removed site based on index
                // Then update list 
                chrome.storage.sync.get(["saved_redirect", "saved_r_names"], function(results) {
                    var rem_update_r = results.saved_redirect.redirects;
                    var rem_update_r_names = results.saved_r_names.sites;

                    rem_update_r.splice(item_id_r, 1);
                    rem_update_r_names.splice(item_id_r, 1); 
     
                    chrome.storage.sync.set({"saved_redirect": {redirects: rem_update_r},
                                             "saved_r_names": {sites: rem_update_r_names}}, function() {
                        console.log("item removed");
                    });
                });
            } 
        }); 
    });

    
    // listen for changes in storage
    chrome.storage.onChanged.addListener( function(changes, namespace) {
        console.log("changes heard");
     
        // iterate through storage changes by key
        // store values locally for any updated keys
        for(key in changes) {
            var storage_change = changes[key];
  
            if (key == "saved_filter") {
                var filter_c = storage_change.newValue;
            } else if (key == "saved_redirect") {
                var redirects_c = storage_change.newValue; 
            } else if (key == "saved_b_names") {
                var b_names_c = storage_change.newValue;
            } else if (key == "saved_r_names") { 
                var r_names_c = storage_change.newValue;
            } else if (key == "saved_status") {
                var b_status_c = storage_change.newValue; 
            }
        }

        // now that all values are uploaded
        // make updates 
        for(key in changes) {

            // package blocked sites and site names
            if (key == "saved_filter") {
                var b_data = {blocked: []};
                
                for (var i = 0; i < filter_c.urls.length; i++) {
                    b_data.blocked.push(
                        {
                            url: filter_c.urls[i],
                            name: b_names_c.sites[i]
                        });
                }

                // update blocked sites list upon change
                document.getElementById("blocked-sites").innerHTML = preserve_b + template_b(b_data);
                console.log("after compile", document.getElementById("blocked-sites").innerHTML);

            // package redirects sites and site names
            } else if (key == "saved_redirect") {
                var r_data = {redirected: []};
                    console.log("names length", r_names_c.sites.length);
                for (var j = 0; j < redirects_c.redirects.length; j++) {
                    r_data.redirected.push( 
                        {
                            url: redirects_c.redirects[j],
                            name: r_names_c.sites[j]
                        });
                } 

                // update redirect sites list upon change
                document.getElementById("redirect-sites").innerHTML = preserve_r + template_r(r_data);
                console.log("after compile", document.getElementById("redirect-sites").innerHTML); 

            // update blocking status button appearance
            } else if (key == "saved_status") {
                
                if (b_status_c  == "b_enabled") {
                    button.innerHTML = "Disable Blocking";
                    button.classList.remove("blocking_status_disabled");
                    button.classList.add("blocking_status_enabled");

                } else if (b_status_c == "b_disabled") {
                    button.innerHTML = "Enable Blocking";
                    button.classList.remove("blocking_status_enabled");
                    button.classList.add("blocking_status_disabled");            

                } else {
                    console.log("error, no valid state for blocking button");
                }
            }   
        }

    });


    // update button status
    button.addEventListener("click", function() {
    
        if (button.innerHTML == "Enable Blocking") {
            chrome.storage.sync.set({"saved_status": "b_enabled"});

        } else if (button.innerHTML == "Disable Blocking") {
            chrome.storage.sync.set({"saved_status": "b_disabled"});

        } else {
            console.log("error, no valid state for blocking button");
        }   
    }); 

});


