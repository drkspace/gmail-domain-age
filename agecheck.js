
// The base url for the domain info API
const API_BASE = "https://rdap.verisign.com/com/v1/domain/"

// I'm not sure if this is consistent or the best way to select all of the emails
const EMAIL_SPAN_CLASS = 'gD'

// What parent level the domain info box needs to be at when the email is collapsed
const COLLAPSE_PAR_NUM = 4

// What parent level the domain info box needs to be at when the email is expanded
const EXP_PAR_NUM = 10

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

function getRegInfo(data){
    info = {};

    data["events"].forEach(element => {
        info[element["eventAction"]] = (new Date(Date.parse(element["eventDate"]))).toLocaleTimeString(undefined, {year: 'numeric', month: 'long', day: 'numeric' }
        )
    });
    
    return info;
}

function getEmailBlocks(onlyVis){

    spans = Array.from(document.getElementsByClassName(EMAIL_SPAN_CLASS));

    if(onlyVis){
        return spans.filter((ele)=>ele.offsetParent !== null)
    }
    return spans

}

function getEmailAddresses(emailBlocks){
    return emailBlocks.map((ele)=>ele.getAttribute("email"))
}

function addLabel(ele){
    if(ele.getAttribute("data-haslabel")!=="true"){
        addr = ele.getAttribute("email");
        domain = addr.split("@")[1];

        info = getRegInfo(getDomainInfo(domain));
        d = document.createElement("div");
        d.style.border = "black"
        d.style.backgroundColor = "red"
        d.style["border-radius"] = "10px";
        d.style["text-align"] = "center";
        d.style.color = "black"

        d.innerText = "This domain was created on "+info["registration"];

        parNum = EXP_PAR_NUM;

        if(ele.classList.contains("bco")){
            parNum = COLLAPSE_PAR_NUM;
        }

        par = ele;
        for(i=0;i<parNum;i++){
            par = par.parentElement
        }

        par.insertAdjacentElement("afterend", d)
        ele.setAttribute("data-haslabel", "true")
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

// Create a MutationObserver to watch for when the loading div becomes hidden
const observer = new MutationObserver((mutationsList, observer) => {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      // Check if the "display" style property has changed to "none" (hidden)
      if (loadingDiv.style.display === 'none') {
        // The <div> with id "loading" is now hidden
        spans = getEmailBlocks(false)
        spans.forEach(addLabel)
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