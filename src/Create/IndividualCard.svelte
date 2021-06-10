<script>
  import { transition_out } from 'svelte/internal';
import { fade, fly } from 'svelte/transition';
  export let index;
  export let example;
  export let srcEmoji;
  export let targEmoji;
  let visible = true;
</script>

{#if visible}
  <div class="example-card" transition:fade>
    <div class="left" in:fly={{x: -200, duration: 1000}}>	
      <h1 class="example-number">{index+1}</h1>
      <p class="sentence">{srcEmoji} {example.from}</p>
    </div>
    <div class="right" in:fly={{x: 200, duration: 1000}}>
      <p class="sentence">{targEmoji} {example.to}</p>
      <button class="card-selector" on:click={() => {
        visible = false;
      }}>✅</button>
    </div>
  </div>
{/if}

<style>
  .example-card {
		display: flex;
		justify-content: center;
		align-items: center;
		height: fit-content;
		padding: 0;
	}

	.left {
		display: flex;
	}

	.right {
		display: flex;
	}

	.sentence {
		margin: 10px;
  	width: 400px;
		height: 60px;
		overflow: scroll;
  	box-shadow: 0 15px 30px 0 rgba(0,0,0,0.11),
    						0 5px 15px 0 rgba(0,0,0,0.08);
  	background-color: #ffffff;
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
    text-decoration: none;
    font-size: 30px;
  }
</style>