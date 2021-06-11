<script>
	import Router from 'svelte-spa-router';
	import Home from './Home.svelte';
	import CreateDashboard from './Create/CreateDashboard.svelte';
	import ReviewDashboard from './Review/ReviewDashboard.svelte';
	let reviewMode;

</script>

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

<style>
	h1 {
		margin: 0 0 0 5px;
		font-size: 40px;
	}

	a {
		color: #d2661e;
	}

	.nav-button {
		padding-right: 50px;
	}

</style>

