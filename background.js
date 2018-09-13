// declare global variable to track if blocking enabled or disabled
// declare global variable to locally update filter
var b_status;
var filter;


// set default values for all synced storage lists
chrome.runtime.onInstalled.addListener(function () {
    console.log("installed");
    chrome.storage.sync.set({
        "saved_filter": {urls: []}, 
        "saved_redirect": {redirects: []},
        "saved_b_names": {sites: []},
        "saved_r_names": {sites: []}, 
        "saved_status": "b_enabled" 
    });
    // update global variable to enable blocking by default
    b_status = "b_enabled"; 
});


// declare global variable to store callback name for webpage listener
var redirect_site = function () {
    return {redirectUrl: chrome.runtime.getURL("redirect.html")};
};


// declare global variabe to store url of redirect page for browser action button
var redirect_page = chrome.runtime.getURL("redirect.html");


// designate redirect action when browswer action button is clicked
chrome.browserAction.onClicked.addListener(function() {
    window.open(redirect_page, "_blank");
});


// On startup load stored filter into webListener
chrome.runtime.onStartup.addListener(function () {
    console.log("started up"); 
    chrome.storage.sync.get(["saved_filter"], function(result) {
        if (result.saved_filter.urls[0] != null) {
            // update global filter variable 
            filter = result.saved_filter;
            chrome.webRequest.onBeforeRequest.addListener(
                redirect_site,  
                filter,
                ["blocking"]
            );
        } else {
            console.log("no filter found on startup");
        }
        // enable blocking every time chrome browser starts up
        chrome.storage.sync.set({"saved_status": "b_enabled"});
        b_status = "b_enabled";
    });
});


// listen for changes in storage
chrome.storage.onChanged.addListener( function(changes, namespace) {
    
    console.log("changes heard");
   
    // sort through storage change by key (blocked or redirect list)
    for(key in changes) {
        var storage_change = changes[key]; 
       
        // nothing to do here if updated key is for redirects or site names
        if (key == "saved_redirect" || key == "saved_b_names" || key == "saved_r_names") {

        // if updated key is for blocked sites
        } else if (key == "saved_filter") {
      
            filter = storage_change.newValue;      


            // if somehow the first value is still null and wasn't replaced, get rid of listener            
            if (filter.urls[0] == null) {
                console.log("remove web request listener if it exists. filter empty.");
                if (chrome.webRequest.onBeforeRequest.hasListener(redirect_site)) {
                    chrome.webRequest.onBeforeRequest.removeListener(redirect_site);
                }

            // if blocking enabled, update listener with saved filter
            } else if (b_status == "b_enabled") {         
                console.log("filter before update listener:", filter); 
                // remove old listener 
                chrome.webRequest.onBeforeRequest.removeListener(redirect_site);
                // add new listener with different filter
                chrome.webRequest.onBeforeRequest.addListener(
                    redirect_site,
                    filter,
                    ["blocking"]
                );


            // if blocking is disabled
            //   wait until blocking is re-enabled, 
            //   and the webrequest filter will update then
            } else if (b_status == "b_disabled") {
                console.log("address filter update delayed until blocking is re-enabled");
            }


        // if updated key is for blocking status 
        } else if (key == "saved_status") {
            
            b_status = storage_change.newValue;
            
            // if blocking now enabled
            if (b_status == "b_enabled") {

                // add back new listener with saved_filter filter
                chrome.webRequest.onBeforeRequest.addListener(
                    redirect_site,
                    filter,
                    ["blocking"]
                );
            }

            // if blocking now disabled
            else if (b_status == "b_disabled") {

                // remove web request listener
                chrome.webRequest.onBeforeRequest.removeListener(redirect_site);
            } 
 
        // other results are unexpected
        } else {
            console.log("error: unexpected key");
        } 
    }
});



