var swissTemplate = 'swissTemplate';

function cloneGoogleSheet(templateName, newName,) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(templateName).copyTo(ss);

  /* Before cloning the sheet, delete any previous copy */
  var old = ss.getSheetByName(newName);
  if (old) {ss.deleteSheet(old);}

  SpreadsheetApp.flush(); // Utilities.sleep(2000);
  sheet.setName(newName);

  /* Make the new sheet active */
  return sheet
}

function makeSwiss(){
  var s = SpreadsheetApp.getActiveSheet();
  var seedMethod = s.getRange('swissSeedMethod');
  var bracketData = s.getRange('swissBracketData').getValues(); // .map(x => {group: x[0],name: x[1],start: x[2],time: x[3],numTeams: x[4]});
  var numBrackets = bracketData.length;
  var teams = s.getRange('genTeams').getValues().map(x=> x[0]);
  // check data consistancy.  if not  good. say why and return without doing anything.
  
  // divide up teams between brackets.
  // for each  bracket
  //    copy template

  //    if  number of teams is >20  add  in more rows.
  //    add teams:

  //    put  in start time info
  //    previous games? default none.
  
}

function makeSingleElim(){}

function makeDoubleElim(){}

function makeWorldCup(){}

function makeRoundRobin(){}

function makeBrac(){}

