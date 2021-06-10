<script>
	import Router from 'svelte-spa-router';
	import Home from './Home.svelte';
	import ChooseLanguages from './Create/ChooseLanguages.svelte';

</script>

<nav>
	<h1>
		<a href='/#/'>🏠</a>
	</h1>
</nav>

<Router routes = {{
	'/' : Home,
	'/choose-languages' : ChooseLanguages,
}}/>

<style>
	h1 {
		margin: 0 0 0 5px;
		font-size: 40px;
	}
</style>

