<script>
	import IndividualCard from './IndividualCard.svelte';
  import { fly, fade } from 'svelte/transition';
	export let srcLang;
	export let targLang;
	export let srcEmoji;
	export let targEmoji;
	let phraseQuery = '';
	let searched = false;
	let newSearch = '';

	const fetchSentences = async () => {
		searched = true;
		newSearch = phraseQuery;
		const response = await fetch('http://localhost:3000/scrape', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				srcLang,
				targLang,
				phraseQuery
			})
		});
		phraseQuery = '';
    return response.json();
	};
	
</script>

<main>
	<h2 in:fly={{x: -200, duration: 1000}}>1. Search for a {srcEmoji} word, phrase or sentence</h2>
	<h2 in:fly={{x: -200, duration: 1000}}>2. See {targEmoji} translations!</h2>
	<h3 transition:fade>Click the ✅ next to any sentence pair to create a flashcard!</h3>
	<input bind:value={phraseQuery}/>
	<button type="button" on:click={fetchSentences}>
		Submit
	</button>
	{#key newSearch}
		{#if searched}	
			{#await fetchSentences()}
				<p>Getting sentence..</p>
			{:then data}
				{#each data.examples.slice(0, 5) as example, i (i)}
					<IndividualCard index={i} {example} {srcEmoji} {srcLang} {targEmoji} {targLang}/>
				{/each}
			{:catch error}
				<p>An error occurred! {error}</p>
			{/await}
		{/if}
	{/key}
</main>

<style>
	main {
		text-align: center;
		padding: 0;
		max-width: 100%;
		margin: 0 auto;
	}

	h2 {
		margin: 0 auto;
		text-align: left;
		padding-left: 100px;
	}
</style>