var bracketListStart = [3, 8];

function getAllTeams(){
  return SpreadsheetApp.getActiveSpreadsheet().getRange('allTeams').filter(x=>x[0]).flat();
}

function getAllBrackets(){
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(s=> getBracketFromSheet(s)).filter(x=>x);
}

function writeListOfBrackets(){
  brackets =  getAllBrackets();
  ss = SpreadsheetApp.getActiveSpreadsheet();
  overview = ss.getSheetByName('overview');
  overview.getRange(3, 8, brackets.length, 3).setValues(brackets.map(b=>[b.name, b.bracketType, b.startTime]));
  SpreadsheetApp.getActiveSpreadsheet().setNamedRange('bracketList',
                                                      overview.getRange(bracketListStart[0], bracketListStart[1], brackets.length, 1));
}
