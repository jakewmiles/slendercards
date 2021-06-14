<script>
	import IndividualCard from './IndividualCard.svelte';
  import { fade } from 'svelte/transition';
	export let srcLang, targLang, srcEmoji, targEmoji;
	let phraseQuery = '';
	let searched = false;
	let newSearch = '';
	let startIndex = 0;
	let endIndex = 5;
	let visible = true;

	const fetchSentences = async () => {
		if (!phraseQuery) return;
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
	<h2 transition:fade>1. Search for a {srcEmoji} word, phrase or sentence...</h2>
	<h2 transition:fade>2. See {targEmoji} translations!</h2>
	<h3 transition:fade>Click ✅ to create a Text-to-Speech flashcard!</h3>
	<input placeholder='Search...' bind:value={phraseQuery}/>
	<button class='animated-button fetch-sentences' on:click={fetchSentences}>
		Submit
	</button>
	{#key newSearch}
		{#if searched}	
			{#await fetchSentences()}
				<p>Getting sentence..</p>
			{:then data}
			<button class='animated-button fetch-sentences' on:click={() => {
				startIndex += 5;
				endIndex += 5;
				if (endIndex > data.examples.length) {
					visible = true;
					startIndex = 0;
					endIndex = 5;
				}
			}}>↺</button>
			<div id='sentences-grid'>
				<p>Found {data.examples.length} sentences. Showing sentences {startIndex + 1} - {endIndex > data.examples.length ? data.examples.length : endIndex}</p>
				<!-- {#key startIndex} -->
				{#each data.examples.slice(startIndex, endIndex) as example, i}
					<div class='individual-sentence'>
						<IndividualCard class={i} {visible} {example} {srcEmoji} {srcLang} {targEmoji} {targLang}/>
					</div>
				{/each}
				<!-- {/key} -->
			</div>
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

	input {
		height: 40px;
		width: 400px;
		background-color: #000;
		color: #FFF;
	}

	input::placeholder {
		color: #FFF;
	}

	#sentences-grid {
		display: grid;
		grid-template-rows: repeat(min);
	}

	.fetch-sentences {
    z-index: 2;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .fetch-sentences:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .fetch-sentences:hover {
    color: #000;
  }
  .fetch-sentences:hover:after {
    -webkit-transform: scale(1) rotate(-180deg);
    transform: scale(1) rotate(-180deg);
    background: #FFF;
  }
</style>