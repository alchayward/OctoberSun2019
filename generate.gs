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
  SpreadsheetApp.setActiveSheet(sheet);
  return sheet;
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

function makeSingleElim(){
  var s = SpreadsheetApp.getActiveSheet();
  var newSheet = cloneGoogleSheet("elimTemplate", s.getRange('generateSingleElimName').getValue());
  var numTeams = s.getRange('generateSingleElimNumTeams').getValue();
  newSheet.getRange("numTeams").setValue(numTeams);
  var teams = [];for (let i=0; i<numTeams;i++){teams.push([i+1,"seed#" + (i+1).toString()]);};
  const selB = new SingleEliminationBracket(SpreadsheetApp.getActiveSheet());
  
  var startTime = s.getRange('generateSingleElimTime').getValue();
  newSheet.getRange("startTime").setValue(startTime);
  
  if (numTeams > 32){  newSheet.insertRows(33, (numTeams-32)); }
  newSheet.getRange(2,1, numTeams, 2).setValues(teams).setBackgroundColor('green');
  newSheet.getRange('bracketType').setValue("single elim");
  selB.writeBracket();
  writeListOfBrackets();
}

function makeDoubleElim(){
  var s = SpreadsheetApp.getActiveSheet();
  var newSheet = cloneGoogleSheet("elimTemplate", s.getRange('generateDoubleElimName').getValue());
  var numTeams = s.getRange('generateDoubleElimNumTeams').getValue();
  newSheet.getRange("numTeams").setValue(numTeams);
  
  var doubleFinal = s.getRange('generateDoubleElimFinal2').getValue();
  newSheet.getRange('bracketType').setValue("double elim");
  
  var startTime = s.getRange('generateDoubleElimTime').getValue();
  newSheet.getRange("startTime").setValue(startTime);
  
  const selB = new DoubleEliminationBracket(SpreadsheetApp.getActiveSheet(), doubleFinal);
  
  if (numTeams > 32){ newSheet.insertRows(33, (numTeams-32)); }
  var teams = [];for (let i=0; i<numTeams;i++){teams.push([i+1,"seed#" + (i+1).toString()]);};
  newSheet.getRange(2,1, numTeams, 2).setValues(teams).setBackgroundColor('green');
  selB.writeBracket();
  writeListOfBrackets();
}

function makeWorldCup(){}

function makeRoundRobin(){}

function makeBrac(){}

