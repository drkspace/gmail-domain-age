
// The base url for the domain info API
const API_BASE = "https://rdap.verisign.com/com/v1/domain/"

// I'm not sure if this is consistent or the best way to select all of the emails
const EMAIL_SPAN_CLASS = 'gD'

// What parent level the domain info box needs to be at when the email is collapsed
const COLLAPSE_PAR_NUM = 4

// What parent level the domain info box needs to be at when the email is expanded
const EXP_PAR_NUM = 10

const LABEL_COLORS = {"Good":"green",
                      "Warning": "orange",
                      "Suspicious":"red"}

// Get the domain info from verisign
// Modified from https://stackoverflow.com/a/22790025
function getDomainInfo(domain2Check) {
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET", API_BASE+domain2Check, false);
    Httpreq.send(null);

    if(Httpreq.responseText.length == 0){
        return null
    }

    return JSON.parse(Httpreq.responseText);
} 

// Get the registration time info from the API
function getRegInfo(data){
    let info = {};

    data["events"].forEach(element => {
        tmp = new Date(Date.parse(element["eventDate"]))
        
        let ea = element["eventAction"]
        
        info[ea] = {}
        info[ea]["date"] = tmp.toLocaleTimeString(undefined, {year: 'numeric', month: 'long', day: 'numeric' })
        info[ea]["diff"] = Date.now() - tmp.getTime()
        
    });
    
    return info;
}


// Get the spans that contain the email headers
function getEmailBlocks(onlyVis){

    spans = Array.from(document.getElementsByClassName(EMAIL_SPAN_CLASS));

    if(onlyVis){
        return spans.filter((ele)=>ele.offsetParent !== null)
    }
    return spans

}

// Add a label to an email
// Will add attribute to element to only 1 label is added
function addLabel(ele){

    // Test if element already has label
    if(ele.getAttribute("data-haslabel")!=="true"){
        addr = ele.getAttribute("email");
        domain = addr.split("@")[1];

        d = document.createElement("div");
        d.style.border = "black"
        d.style.backgroundColor = LABEL_COLORS["Good"]
        d.style["border-radius"] = "10px";
        d.style["text-align"] = "center";
        d.style.color = "black"

        tmp = getDomainInfo(domain);
        console.log(tmp)
        if(tmp != null){
        info = getRegInfo(tmp);
        
        d.innerText = "This domain was created on "+info["registration"]["date"];
        diffDays = info["registration"]["diff"] / (1000 * 3600 * 24);
        
        // Different text/color depending on the time difference
        if(diffDays < 1){
            d.style.backgroundColor = LABEL_COLORS["Suspicious"]
            d.innerText += " (Less than a day ago!!!)"
        }
        else if(diffDays < 7){
            d.style.backgroundColor = LABEL_COLORS["Suspicious"]
            d.innerText += " (Less than a week ago!!!)"
        }
        else if(diffDays < 365.25){
            d.style.backgroundColor = LABEL_COLORS["Warning"]
            d.innerText += " (Less than a year ago)"
        }
        else{
            d.innerText += " (More than a year ago)"
        }
        }
        else{
            d.innerText = "Weird, this domain does not exist"
        }
        parNum = EXP_PAR_NUM;

        if(ele.classList.contains("bco")){
            parNum = COLLAPSE_PAR_NUM;
        }

        par = ele;
        for(i=0;i<parNum;i++){
            par = par.parentElement
        }

        // Insert label in correct spot
        par.insertAdjacentElement("afterend", d)
        ele.setAttribute("data-haslabel", "true")
        
        // Add event listener for if the email is expanded or collapsed
        // The other form of the email doesn't exist in the DOM until it needs to be seen
        par.addEventListener("click", event=>{
            window.setTimeout(()=>{
            spans = getEmailBlocks(false)
            spans.forEach(addLabel)}
            , 0)
        })
    }
}



// Select the <div> element with id "loading"
const loadingDiv = document.getElementById('loading');

// The div with folded emails
// Will be filled in the following mutation observer
let accordEle = null;

let obs = null;

// Create a MutationObserver to watch for when the loading div becomes hidden
const observer = new MutationObserver((mutationsList, observer) => {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      // Check if the "display" style property has changed to "none" (hidden)
      if (loadingDiv.style.display === 'none') {
        // The <div> with id "loading" is now hidden
        spans = getEmailBlocks(false)
        spans.forEach(addLabel)

        let tmp = document.getElementsByClassName("kQ bg adv")
        if (tmp.length > 0){
            accordEle = tmp[0]
            obs = new MutationObserver((mutationsList, observer) => {

                mutationsList.forEach((mutation) => {
                  if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Check if the "display" style property has changed to "none" (hidden)
                    if (accordEle.className == "kv bg") {

                        // The <div> with id "loading" is now hidden
                      spans = getEmailBlocks(false)
                      spans.forEach(addLabel)
                      obs.disconnect()
                    } 
                  }
                });
              });

            obs.observe(accordEle, { attributes: true, attributeFilter: ['class'] });
            
        }
      } 
    }
  });
});

// Start observing the <div> element for changes in the 'style' attribute
const config = { attributes: true };
observer.observe(loadingDiv, config);





window.addEventListener('popstate', function(event) {
    spans = getEmailBlocks(false)
    spans.forEach(addLabel)
  });