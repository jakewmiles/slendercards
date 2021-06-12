<script>
	import Router from 'svelte-spa-router';
	import Home from './Home.svelte';
	import CreateDashboard from './Create/CreateDashboard.svelte';
	import ReviewDashboard from './Review/ReviewDashboard.svelte';
	let reviewMode;

</script>
<body>
	<nav>
			<a class='nav-button' href='/#/'>🏠</a>
			<a class='nav-button' href='/#/create-dashboard'>CREATE</a>
			<a class='nav-button' href='/#/review-dashboard'>REVIEW</a>
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
		display: flex;
		text-align: center;
		overflow-x: scroll;
		z-index: 3;
	}

	a {
		color: #d2661e;
		font-size: 200%;
	}

	.nav-button {
		padding-top: 10px;
		padding-left: 75px;
		padding-right: 75px;
		width: 33%;
	}

	
</style>

