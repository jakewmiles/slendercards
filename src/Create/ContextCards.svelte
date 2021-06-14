<script>
	import IndividualCard from './IndividualCard.svelte';
  import { fade } from 'svelte/transition';
	export let srcLang, targLang, srcEmoji, targEmoji;
	let phraseQuery = '';
	let searched = false;
	let newSearch = '';
	let startIndex = 0;
	let endIndex = 5;

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
	<h2 transition:fade>1. Search for a {srcEmoji} word, phrase or sentence</h2>
	<h2 transition:fade>2. See {targEmoji} translations!</h2>
	<h3 transition:fade>Click the ✅ next to any sentence pair to create a flashcard!</h3>
	<input bind:value={phraseQuery}/>
	<button on:click={fetchSentences}>
		Submit
	</button>
	{#key newSearch}
		{#if searched}	
			{#await fetchSentences()}
				<p>Getting sentence..</p>
			{:then data}
			<button on:click={() => {
				startIndex += 5;
				endIndex += 5;
				if (endIndex > data.examples.length) {
					startIndex = 0;
					endIndex = 5;
				}
			}}>↺</button>
			<p>Found {data.examples.length} sentences. Showing sentences {startIndex + 1} - {endIndex}</p>
				{#each data.examples.slice(startIndex, endIndex) as example}
					<IndividualCard {example} {srcEmoji} {srcLang} {targEmoji} {targLang}/>
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