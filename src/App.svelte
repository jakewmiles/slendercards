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
	<nav>
			<button class='animated-button nav-button' on:click={() => loadPage('#/')}>🏠</button>
			<button class='animated-button nav-button' on:click={() => loadPage('#/create-dashboard')}>CREATE</button>
			<button class='animated-button nav-button' on:click={() => loadPage('#/review-dashboard')}>REVIEW</button>
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
		min-width: 600px;
	}

	nav {
		margin-left: 1%;
		display: flex;
		text-align: center;
		overflow-x: scroll;
	}

	.nav-button {
		width: 33%;
		font-size: 150%;
	}

	.animated-button {
    color: white;
    height: 60px;
    background: transparent;
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

