<script>
	import IndividualCard from './IndividualCard.svelte';
  import { fade } from 'svelte/transition';
	export let srcLang, targLang, srcEmoji, targEmoji;
	let phraseQuery = '';
	let searched = false;
	let newSearch = '';
	let startIndex = 0;
	let endIndex = 4;
	let visible = true;
	let readyToRender = true;

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
	<div id='instructions'>
		<h4 transition:fade>1. Search for a {srcEmoji} word, phrase or sentence...</h4>
		<h4 transition:fade>2. See {targEmoji} translations!</h4>
		<h4 transition:fade>Click ✅ to create a Text-to-Speech flashcard!</h4>
	</div>
	<div id='searcher'>
		<input transition:fade placeholder='Search...' bind:value={phraseQuery}/>
		<button transition:fade class='animated-button fetch-sentences' on:click={fetchSentences}>
			Submit
		</button>
	</div>
		{#key newSearch}
		{#if searched}	
		{#await fetchSentences()}
		<p>Getting sentence..</p>
		{:then data}
		<div id='shuffle-sentences'>
			<button transition:fade class='animated-button fetch-sentences' on:click={() => {
				startIndex -= 4;
				endIndex -= 4;
				if (endIndex <= 0) {
					visible = true;
					startIndex = (data.examples.length - 4) < 0 ? 0 : data.examples.length - 4;
					endIndex = data.examples.length;
				}
			}}>←</button>
			<button transition:fade class='animated-button fetch-sentences' on:click={() => {
				startIndex += 4;
				endIndex += 4;
				if (endIndex > data.examples.length) {
					visible = true;
					startIndex = 0;
					endIndex = 4;
				}
			}}>→</button>
		</div>
			<div id='sentences-grid'>
				<p>Found {data.examples.length} sentences. Showing sentences {startIndex + 1} - {endIndex > data.examples.length ? data.examples.length : endIndex}</p>
				{#key startIndex}
				<div transition:fade on:outrostart={() => readyToRender = false} on:outroend={() => readyToRender = true}>
						{#if readyToRender}
							{#each data.examples.slice(startIndex, endIndex) as example}
								<IndividualCard {visible} {example} {srcEmoji} {srcLang} {targEmoji} {targLang}/>
							{/each}
						{/if}
					</div>
					{/key}
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
	#instructions {
		margin-top: 25px;
		margin-left: 40px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	#searcher {
		margin-left: 40px;
		width: 768px;
		display: flex;
	}
	#shuffle-sentences {
		display: flex;
		margin-left: 556px;
		margin-top: -48px;
	}
	h4 {
		margin: 0 0 10px 10px;
	}

	input {
		height: 40px;
		width: 450px;
		background-color: rgb(50, 50, 50);
		color: #FFF;
	}

	input::placeholder {
		color: #FFF;
	}

	#sentences-grid {
		display: grid;
		grid-template-rows: repeat(min);
		margin-top: 20px;
		max-height: 400px;
		overflow-y: scroll;
	}

	.fetch-sentences {
    z-index: 2;
		border-radius: 20px;
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