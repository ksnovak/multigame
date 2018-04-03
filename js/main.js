
$(function() {

	var DEBUG_index = 0;

	var gameAspectRatio = 0.75;
	var gameWidth = 90;

	var streamAspectRatio = 1.75;
	var streamWidth = 230

	class Game {
		constructor (game) {
			this.id = Number(game.id);
			this.name = game.name;
			this.box_art_url = game.box_art_url.replace('{width}', gameWidth).replace('{height}', parseInt(gameWidth/gameAspectRatio));
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
		games.set(Number(game.id), new Game(game));
	}

	function getSelectedGames() {
		console.log(++DEBUG_index + ' in getSelectedGames()');
		allowSearch(false);
		$.ajax({
			type:     'GET',  
			url:      'https://api.twitch.tv/helix/games',  
			dataType: 'json',  
			data: 	  { name: ['rimworld', 'dead cells', 'into the breach'] },
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				response.data.forEach(function(responseGame) {
					setGame(responseGame);
				})
				getStreamers();
			}
		})
	}

	function getStreamers() {
		console.log(++DEBUG_index + ' in getStreamers()');
		console.log('	' + Array.from(games.keys()));
		$.ajax({  
			type:     'GET',  
			url:      'https://api.twitch.tv/helix/streams?first=100',  
			dataType: 'json',  
			data: {
				game_id: Array.from(games.keys()),
				language: $('#englishOnly').prop('checked') ? 'en' : ''
			},
			headers:  {  
				'Client-ID':      APP_CLIENT_ID,  
				'Authorization':  'Bearer ' + OAUTH_ACCESS_TOKEN  
			},  
			error:    function(response) { 
				console.log(DEBUG_index + ' error')
			},  
			success:  function(response) { 
				console.log('hihi')
				streamers = [];
				response.data.forEach(function(stream){ 
					streamers.push(new Streamer(stream));
				});

				getStreamerNames();
			}
		});
	}

	function getStreamerNames() {
		console.log(++DEBUG_index + ' in getStreamerNames()');
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
				console.log(DEBUG_index + ' error')
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

	function buildTable() {
		console.log(++DEBUG_index + ' in buildTable()');
	
		var $main = $('#main');
		var appendString = '';

		streamers.forEach(function(streamer) {
			game = games.get(streamer.game_id);

			appendString += '<tr>' 
			+ '<td><img src="' + streamer.thumbnail_url + '"/></td>'
			+ '<td><a href="https://www.twitch.tv/' + streamer.login + '">' + streamer.login + '</a><br/>' + streamer.title + '</td>'
			+ '<td>' + streamer.viewer_count + ' viewers</td>'
			+ '<td><img src="' + game.box_art_url + '"/><br>'  + game.name + '</td>'
			+ '</tr>';
		})

		$main.html(appendString);
	}

	function clearData() {
		console.log('a in clearData()');
		allowSearch(true)
		$('#main').html('');
		streamers = [];
	}

	function allowSearch(allowed) {
		console.log('b in allowSearch()');
		$('#search').prop('disabled', !allowed);
		$('#clearTable').prop('disabled', allowed);
	}

	$('#clearTable').click(function(){
		clearData();
	});
	$('#search').click(function() {
		getSelectedGames()
	});
	$('#filters').change(function() {
		allowSearch(true);
	})

	getSelectedGames();

	

});