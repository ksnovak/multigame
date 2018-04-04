
$(function() {

	var DEBUG_index = 0;
	var DEBUG_on = false;

	var gameAspectRatio = 0.75;
	var gameWidth = 90;

	var streamAspectRatio = 1.75;
	var streamWidth = 230

	class Game {
		constructor (game) {
			this.id = Number(game.game._id);
			this.name = game.game.name;
			this.box_art_url = game.game.box.medium;
			this.viewers = game.viewers;
			this.channels = game.channels;
		}
	}
	class Streamer {
		constructor(stream) {
			this.id = Number(stream.id);
			this.user_id = Number(stream.user_id);
			this.title = stream.title;
			this.viewer_count = stream.viewer_count;
			this.game_id = Number(stream.game_id);
			this.thumbnail_url = stream.thumbnail_url.replace('{width}', streamWidth).replace('{height}', parseInt(streamWidth/streamAspectRatio));
		}

		setName(name) {
			this.login = name;
		}
	}

	var games = new Map();
	var streamers = new Map();

	function setGame(game) { 
		games.set(Number(game.game._id), new Game(game));
	}

	function getTopGames() {
		if (DEBUG_on) console.log(DEBUG_index + ' in getTopGames()');

		$.ajax({
			type:     'GET',  
			url:      'https://api.twitch.tv/kraken/games/top',  
			dataType: 'json',  
			data: 	  { limit: 100 },
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				if (DEBUG_on) console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				response.top.forEach(function(game){
					setGame(game);
				})
				buildGameList();
			}
		})

	}
/*
	function getSelectedGames() {
		if (DEBUG_on) console.log(++DEBUG_index + ' in getSelectedGames()');

		$.ajax({
			type:     'GET',  
			url:      'https://api.twitch.tv/helix/games',  
			dataType: 'json',  
			data: 	  { 
				// id: selectedGames
				name: ['rimworld', 'dead cells', 'into the breach', 'dungeon of the endless', 'final fantasy xiv online', 'slay the spire', 'they are billions'] 
			},
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				if (DEBUG_on) console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				response.data.forEach(function(responseGame) {
					setGame(responseGame);
				})
				getStreamers();
			}
		})
	}
*/

	function getStreamers() {
		if (DEBUG_on) console.log(++DEBUG_index + ' in getStreamers()');
		// console.log('	' + Array.from(games.keys()));

		var gamesList = $('#gameList').val();

		if (gamesList.length == 0) {
			alert('No games selected');

			return;
		}

		$.ajax({  
			type:     'GET',  
			url:      'https://api.twitch.tv/helix/streams?first=100',  
			dataType: 'json',  
			data: {
				game_id: gamesList,
				language: $('#englishOnly').prop('checked') ? 'en' : ''
			},
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				if (DEBUG_on) console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				streamers = [];
				response.data.forEach(function(stream){ 
					streamers.push(new Streamer(stream));
				});

				getStreamerNames();
			}
		});
	}

	function getStreamerNames() {
		if (DEBUG_on) console.log(++DEBUG_index + ' in getStreamerNames()');
		$.ajax({  
			type:     'GET',  
			url:      'https://api.twitch.tv/helix/users',  
			dataType: 'json',  
			data: {
				id: streamers.map(streamer => streamer.user_id)
			},
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				if (DEBUG_on) console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				response.data.forEach(function(streamer){ 
					var index = streamers.findIndex(stream => stream.user_id == streamer.id);

					streamers[index].setName(streamer.login);
				});
				buildTable();
			}
		});		
	}

	function buildGameList() {
		if (DEBUG_on) console.log(++DEBUG_index + ' in buildGameList()');

		var $gameList = $('#gameList');
		var appendString = '';

		games.forEach(function(game) {
			appendString += '<option value="' + game.id + '">' + game.name + /*" (" + game.viewers + " viewers, on " + game.channels + " channels)" + */"</option>";
		})

		$gameList.html(appendString);
	}

	function buildTable() {
		if (DEBUG_on) console.log(++DEBUG_index + ' in buildTable()');
	
		var $main = $('#main');
		var appendString = '';

		streamers.forEach(function(streamer) {
			game = games.get(streamer.game_id);


			appendString += '<div class="row border border-secondary" >' 
				+ '<div class="col-sm-2" style="padding: 0px;">'
					+ '<img src="' + streamer.thumbnail_url + '" style="width: 100%;"/>'
				+ '</div>'
				+ '<div class="col-sm-10"><div class="row border border-secondary">'
					+ '<div class="col-lg-9 col-sm-12 border border-dark">'
						+ '<a href="https://www.twitch.tv/' + streamer.login + '">' + streamer.login + '</a><br/>' + streamer.title 
					+ '</div>'
					+ '<div class="col-lg-1 col-sm-6 border border-dark">' 
						+ streamer.viewer_count + ' viewers'
					+ '</div>'
					+ '<div class="col-lg-2 col-sm-6 border border-dark ">'
						+ '<div class="d-none d-lg-block"><img src="' + game.box_art_url + '" style="width: 100%; max-width: 90px;"/><br></div>'  + game.name 
					+ '</div>'
				+ '</div></div>'
			+ '</div>';
		})

		$main.html(appendString);
	}

	function clearData() {
		if (DEBUG_on) console.log('a in clearData()');
		$('#main').html('');
		streamers = [];
	}

	$('#clearTable').click(function(){
		clearData();
	});
	$('#search').click(function() {
		//getSelectedGames()
		getStreamers();
	})
	getTopGames();

	

});