// functions for Swiss Rounds

// I'm not sure how fragile everything is. Can probably be broken pretty easily.
// Lots  of string comparisons, which I think could lead to some funky buisness

// Constants that extract important info. Should replace with named ranges. 
var writeSuggestedGamesHere = [11, 15];
var sortingFuncs = {'points': ((x, y) => x.points-y.points),
                 'delta': ((x, y) => x.delta-y.delta),
                 'goals for':((x, y) => x.gf-y.gf),
                 'goals against':((x, y) => y.ga-x.ga),
                 'games played':((x, y) => y.gamesPlayed-x.gamesPlayed),
                 'previous meet':((x, y) => 0)}; // special logic in compare function. not transitive, so be careful.

class Bracket {
    constructor(sheet) {
      this.sheet = sheet;
      this.name =  sheet.getName();
      this.bracketType = sheet.getRange('bracketType').getValue();
      this.startTime = sheet.getRange('startTime').getValue();
    }
  
   getTeams(){ return this.sheet.getRange('teams').offset(0, 0, this.numTeams, 1).getValues().flat(); }
  
   getGames() {
     var teams = this.getTeams();
     var gamesRange = this.sheet.getRange('games');
     var games = gamesRange.getValues().map(this.gameFromRow).filter(value => this.validGame(value, teams));
     for (var i=0;i<games.length;i++){  // assume that  it is from this bracket if there is no other name;
       var g=games[i];
       g.bracketName = g.bracketName ? g.bracketName : this.name;
     }
     return games;
   }
  
  validGame(game, teams) {
    var valids = [
      (Number.isInteger(game.score1) && (game.score1 >= 0)) || (game.score1 == null),
      (Number.isInteger(game.score2) && (game.score2 >= 0)) || (game.score2 == null),
      teams.includes(game.team1),
      teams.includes(game.team2)];
    
    return valids.every(Boolean);
  }

  gameFromRow(row) {
    var game = {
      round : row[0],
      team1 : row[1],
      team2 : row[2],
      score1: row[3] === "" ? null : row[3] ,
      score2: row[4] === "" ? null : row[4],
      bracketName: row[5]};
  return game;  
  }
  
}

class SwissBracket extends Bracket {
 constructor(sheet) {
   super(sheet);
   this.numTeams = sheet.getRange('numTeams').getValue();
 }
  
  sortRangeAll() {    
    var ranks = this.getRanks();
    this.sheet.getRange('teams').offset(0, 0, this.numTeams, 1).setValues(ranks.map(x=>[x])); 
 }
  
  gameFromRow(row) {
    var game = {
      round : row[0],
      team1 : row[1],
      team2 : row[2],
      score1: row[3] === "" ? null : row[3] ,
      score2: row[4] === "" ? null : row[4],
      bracketName: row[5]};
  return game;  
  }
  
  validGame(game, teams) {
    var valids = [
      (Number.isInteger(game.score1) && (game.score1 >= 0)) || (game.score1 == null),
      (Number.isInteger(game.score2) && (game.score2 >= 0)) || (game.score2 == null),
      teams.includes(game.team1),
      teams.includes(game.team2)];
    
    return valids.every(Boolean);
  }
  
  gameIsFinished(game){
    return Number.isInteger(game.score1) && Number.isInteger(game.score2);
  }

  getScores()  {
    var scores = this.sheet.getRange(2, 2, this.numTeams, 10).getValues();
    return scores.map(x => ({name:x[0], wins:x[2], losses:x[3], draws:x[4], points:x[5], delta:x[6], gf:x[7], ga:x[8], gamesPlayed:x[9]}));
  }
    
  getCompareFunction(){
    var orderings = this.sheet.getRange('sortOrder').getValues().flat();
    var fnList = orderings.map(x => sortingFuncs[x]);
    // special stuff for previous meet
    var ind = orderings.indexOf('previous meet');
    if (ind >= 0) {
      var gamesGraph = buildGamesGraph(this.getTeams(), this.getGames());
      var meetFn = function (x, y) {
        var vs = gamesGraph[x.name][y.name];
        if (vs == null) {return 0;}
        else if (vs[0] == null || vs[1] == null) { return 0;}
        else {return vs[0] - vs[1];}
      }
      fnList[ind]=meetFn;
    }
    return decendingSortFn(fnList);
  }
  
  getRanks() {
    var scores = this.getScores();
    var compareFunction = this.getCompareFunction();
    var ranks = scores.sort(compareFunction).map(x=>x.name).reverse();
    return ranks;
  }
  
  suggestGamesForRound(round) {
    console.log(round);
    var games = this.getGames();
    var teams = this.getTeams();
    var teamsAlreadySeeded = games.filter(game => game.round == round).map(game => [game.team1, game.team2]).flat();
    var teamsToSeed = teams.filter(t => !(teamsAlreadySeeded.includes(t)));
    
    var gamesGraph = buildGamesGraph(teamsToSeed, games);
    
    var ranks = this.getRanks().filter(t => !(teamsAlreadySeeded.includes(t)));
    var newGames = swissSeedBasic(gamesGraph, ranks); 
    newGames = newGames ? newGames : [];
    console.log(newGames);
    var error = null;
    if (newGames.length < teamsToSeed.length/2){error = 'no good round';}
    return ({games:newGames, error:error});
  } 
}

function sortRangeAll() {
  const sb = new SwissBracket(SpreadsheetApp.getActiveSheet());
  sb.sortRangeAll();
 }

function buildGamesGraph(teams, games){
  var gamesGraph = {};
    for (var i=0; i < teams.length; i++) {
      gamesGraph[teams[i]] = {};
      for (var j=0; j < teams.length; j++) {
        gamesGraph[teams[i]][teams[j]]=null;
      }
    }
    
    for (var i=0; i < games.length; i++) { 
      var game = games[i];
      if (teams.includes(game.team1) && teams.includes(game.team2)) {
        gamesGraph[game.team1][game.team2] = [game.score1, game.score2];
        gamesGraph[game.team2][game.team1] = [game.score2, game.score1];
      }
    }
  return gamesGraph;
}

function swissSeedBasic(gamesGraph, ranks) {
  // recursivly desends though possible assingments until a valid assignment is found.
  // ranks order of teams. ranks[0] is the first team, ranks[2] is the second etc.
  // will return null if there are no possiblities of repeating a match.
  // otherwise, return a list of games [[t1, t2], ...]
 
  if (ranks.length >= 1000) {return null;} // max recursion depth is 1000.
  if ((ranks.length % 2) != 0) {return null;}  // must  have even number of teams
  var best = [];
  
  var recurSwiss = function(ranks){
    var numTeams = ranks.length;
    if (numTeams == 0) { return []; } // end of recursion
    var team1 = ranks[0];
    for (var i = 1; i < numTeams; i++) {
      var team2 = ranks[i];
      if (gamesGraph[team1][team2] == null) {
        var newRanks = ranks.slice(); newRanks.splice(i,1); newRanks.splice(0,1); //drop team1 and team2 from ranks
        var otherGames = recurSwiss(newRanks); // recur on new ranks
        if (otherGames != null) {
          var newGames = [[team1, team2]].concat(otherGames);
          if (newGames.length > best.length){best = newGames;}
          return newGames;
        }
      }
    }
    return null; // can't find a non-conflicting match
  }
  var games = recurSwiss(ranks);
  return (games != null) ? games : best;
}

function writeSuggestedGames(){
  var sheet = SpreadsheetApp.getActiveSheet();
  const bracket = new SwissBracket(sheet);
  const round = sheet.getRange('nextRound').getValue();
  const suggested = bracket.suggestGamesForRound(round);

  const cell = writeSuggestedGamesHere;
  if (suggested.error != null) {
    dispMsg('Sorry, something went wrong: ' + suggested.error + ' \n  You will have to do it by hand and have some teams play twice or something :(');
  }
  var newGames = suggested.games;
  range = sheet.getRange(cell[0], cell[1], newGames.length, 5);
  newGames = newGames.map(g => [round, g[0], g[1], null, null]);
  range.setValues(newGames);
   
}

function decendingSortFn(fnList){
  var compare = function(t1, t2) {
    for (i=0; i<fnList.length;i++) {
      let diff = fnList[i](t1,t2);
      if (diff != 0) {return diff;}
    }
  }
  return compare;
}

function makePlayedMatrix(){
  var sheet = SpreadsheetApp.getActiveSheet();
  var info = getSessionInfo(sheet);
  var teams = getTeams(sheet);
  var corner = [1, 15];
  
  var vRange = sheet.getRange(corner[0]+1, corner[1], info.numTeams, 1);
  vRange.setValues(transpose([teams]))
  
  var hRange = sheet.getRange(corner[0], corner[1], 1, info.numTeams);
  hRange.setValues([teams]);
}

