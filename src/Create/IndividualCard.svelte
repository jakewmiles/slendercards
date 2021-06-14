<script>
	import { fade, fly } from 'svelte/transition';
  export let example, srcEmoji, srcLang, targEmoji, targLang;
  let visible = true;
	let examplePosted = false;

	const postSentence = async () => {
		if (examplePosted) {
			console.log('Sentence already posted to database!!');
			return;
		};
		examplePosted = true;
		return await fetch('http://localhost:3000/flashcards', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				srcLang,
				targLang,
				srcSentence: example.from,
				targSentence: example.to
			})
		})
	}

</script>

{#if visible}
  <div class="example-card" transition:fade>
    <div class="left" in:fly={{x: -200, duration: 1000}}>	
      <p class="sentence">{srcEmoji} {example.from}</p>
    </div>
    <div class="right" in:fly={{x: 200, duration: 1000}}>
      <p class="sentence">{targEmoji} {example.to}</p>
      <button class="card-selector" on:click={() => {
        visible = false;
				postSentence();
      }}>✅</button>
    </div>
  </div>
{/if}

<style>
  .example-card {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
	}

	.left {
		width: 50%;
		display: flex;
	}

	.right {
		width: 50%;
		display: flex;
	}

	.sentence {
		margin: 10px;
		width: 100%;
		height: 100%;
		padding: 5px;
		overflow: scroll;
  	box-shadow: 0 15px 30px 0 rgba(109, 109, 109, 0.208);
  	background-color: rgb(30, 30, 30);
  	border-radius: 0.5rem;
		border-left: 0 solid #ff6600;
		transition: border-left 150ms ease-in-out, padding-left 150ms ease-in-out;
	}

	.sentence:hover {
		padding-left: 0.5rem;
  	border-left: 0.5rem solid #ff6600;
	}

  .card-selector {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }
</style>