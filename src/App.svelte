<script>
	import Router from 'svelte-spa-router';
	import Home from './Home.svelte';
	import CreateDashboard from './Create/CreateDashboard.svelte';
	import ReviewDashboard from './Review/ReviewDashboard.svelte';

	const loadPage = (destination) => {
		if (location.hash === destination) location.reload();
    location.assign(`${location.origin}/${destination}`);
  }

</script>
<body>
	<nav id='top-navbar'>
		<button class='animated-button nav-button' on:click={() => loadPage('#/')}>
			<span class='emoji'>🏠</span>
			<span class='reveal'>Home</span>
		</button>
	</nav>
	<nav id='bottom-navbar'>
		<button class='animated-button nav-button' on:click={() => loadPage('#/create-dashboard')}>
			<span class='emoji'>✍️</span>
			<span class='reveal'>Create</span>
		</button>
		<button class='animated-button nav-button' on:click={() => loadPage('#/review-dashboard')}>
			<span class='emoji'>📚</span>
			<span class='reveal'>Review</span>
		</button>
	</nav>

	<Router routes = {{
		'/' : Home,
		'/create-dashboard' : CreateDashboard,
		'/review-dashboard' : ReviewDashboard
	}}/>
</body>

<style>
	body {
		background-color: rgb(30, 30, 30);
		color: white;
		padding: 0;
		overflow-y: scroll;
		min-width: 768px;
	}
	nav {
		height: 48px;
		background-color: rgb(30, 30, 30);
	}
	button .reveal {
		display: none;
	}
	button:hover .emoji {
		display: none;
	}
	button:hover .reveal {
		display: inline;
	}
	#top-navbar {
		margin-left: 1%;
		display: flex;
		text-align: center;
		justify-content: center;
	}
	#bottom-navbar {
		display: flex;
		justify-content: center;
  	overflow: hidden;
  	position: absolute;
  	bottom: 0;
  	width: 100%;
	}
	.nav-button {
		width: 100%;
		font-size: 150%;
		margin: 0;
	}
	.animated-button {
		background-color: rgb(30, 30, 30);
		border-radius: 20px;
		color: white;
    height: 48px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    display: inline-block;
  }
	.nav-button {
    z-index: 2;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .nav-button:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .nav-button:hover {
    color: #000;
  }
  .nav-button:hover:after {
    -webkit-transform: scale(1) rotate(180deg);
    transform: scale(1) rotate(180deg);
    background: #FFF;
  }
</style>

