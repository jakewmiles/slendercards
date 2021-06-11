<script>
	import Router from 'svelte-spa-router';
	import Home from './Home.svelte';
	import CreateDashboard from './Create/CreateDashboard.svelte';
	import ReviewDashboard from './Review/ReviewDashboard.svelte';
	let reviewMode;

</script>
<body>
	<nav>
		<h1>
			<a class='nav-button' href='/#/'>🏠</a>
			<a class='nav-button' href='/#/create-dashboard'>CREATE</a>
			<a class='nav-button' href='/#/review-dashboard'>REVIEW</a>
		</h1>
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

	h1 {
		text-align: center;
		margin-bottom: 10px;
		font-size: 200%;
	}

	a {
		color: #d2661e;
	}

	.nav-button {
		padding-left: 50px;
		padding-right: 50px;
	}

</style>

