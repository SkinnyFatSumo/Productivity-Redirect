// get storage values for lists, localize them, then call for update function
function getStorage(new_val, new_name, id, callbackFunction) {

    if (id == "b") {
        chrome.storage.sync.get(["saved_filter", "saved_b_names"], function(result) {
            var filter = result.saved_filter; 
            var b_names = result.saved_b_names;
            
            var redirects = null;
            var r_names = null;

            callbackFunction(new_val, new_name, id, b_names, r_names, filter, redirects);
        }); 

    } else if (id == "r") {
        chrome.storage.sync.get(["saved_redirect", "saved_r_names"], function(result) {
            var redirects = result.saved_redirect;
            var r_names = result.saved_r_names;

            var filter = null;
            var b_names = null;

            callbackFunction(new_val, new_name, id, b_names, r_names, filter, redirects);
        }); 
    }
}


// append new value to localized list of old values, then update storage
function updateList(new_val, new_name, id, b_names, r_names, filter, redirects) {
    
    // if blocked form
    if (id == "b") {
        // append list of blocked sites in filter and names
        filter.urls.push(new_val);
        b_names.sites.push(new_name); 

        chrome.storage.sync.set({"saved_filter": filter, "saved_b_names": b_names});

    // if redirect form
    } else if (id == "r") {
        // append list of redirect sites and names
        redirects.redirects.push(new_val);
        r_names.sites.push(new_name);

        chrome.storage.sync.set({"saved_redirect": redirects, "saved_r_names": r_names});
    }
    
    else {
        console.log("error, no value to update");
        return;
    }
    
    console.log("updates completed: \n"); 
    console.log("blocked names:", JSON.stringify(b_names), "\nfilter:", JSON.stringify(filter));
    console.log("redirect names:", JSON.stringify(r_names), "\nredirects", JSON.stringify(redirects));
   
}


// Wait for submission of new blocked site event to be triggered
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("form").addEventListener("submit", function(event) {

        // prevent actual submission of form
        event.preventDefault();

        // store new value from html doc / form
        var new_block_val = document.getElementById("b").value;
        var new_block_name = document.getElementById("b_name").value; 
        var id = "b";

        // reset form on webpage 
        document.getElementById("form").reset(); 

        // check for empty values and do pattern matching
        if (new_block_val == "" || new_block_val == null || new_block_name == "" || new_block_name == null) {
            console.log("you must enter a url");
            return;
        } else if (new_block_val.endsWith("/")) {
            new_block_val += "*";
        } else if ((! new_block_val.endsWith("/*")) && new_block_val.endsWith("*")) {
            new_block_val = new_block_val.slice(0, -1);
            new_block_val += "/*";
        } else if (! (new_block_val.endsWith("/") || new_block_val.endsWith("/*"))) {
            new_block_val += "/*";
        }


        // insure url is valid according to filter rules
                // otherwise the program breaks
        if (! new_block_val.match(/(?:(?:\*|http|https|file|ftp|chrome-extension):\/\/(?:\*|\*\.[^\/\*]+|[^\/\*]+)?(?:\/.*))|<all_urls>/)) { 
            console.log("invalid url");
            alert("That URL is invalid. Please double check and try again.");
            // after alert nothing left to do, so no corrupted values will be added       
            // alerts are annoying, but most invalid urls will be caught by the declaration of input type as url on form
            // so this alert will pop for strange less common mistypes
            // NOTE: this regex matching demands the path end with "/*"
         
        } else {

            // log progress
            console.log("new values for blocked site retrieved from form");
            console.log(new_block_val, new_block_name);

            // get storage values and store locally, pass them on for updating 
            getStorage(new_block_val, new_block_name, id, updateList);
        }
    });
}); 



// Wait for submission of new redirect site event to be triggered
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("redirect_form").addEventListener("submit", function(event) {
        
        // prevent actual submission of form
        event.preventDefault();

        // store new value from html doc / form
        var new_redirect_val = document.getElementById("r").value;
        var new_redirect_name = document.getElementById("r_name").value;
        var id = "r";    
        
        // reset form on webpage
        document.getElementById("redirect_form").reset();

        // make sure entries are not empty
        if (new_redirect_val == "" || new_redirect_val == null || new_redirect_name == "" || new_redirect_name == null) {
            console.log("you must enter a url");
            return;
        }
        
        // log progress
        console.log("new value for redirect site retrieved from form");
        console.log(new_redirect_val, new_redirect_name);
        
        // get storage values and store locally, pass them on for updating
        getStorage(new_redirect_val, new_redirect_name, id, updateList);
    }); 
}); 
    

