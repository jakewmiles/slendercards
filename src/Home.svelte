<script>
  import { fade } from 'svelte/transition';
  let renderReady = true;
</script>

<main>
  {#if renderReady}
  <div class="container">
	  <h1>Welcome to</h1>
    <img src='animated-logo.svg' alt='slendercards'>
    <h3>Click <span id='create'>✍️</span>create or <span id='review'>📚</span>review to get started!</h3>
  </div>
  {/if}
</main>

<style>
  .container {
    text-align: center;
    display: flex;
    flex-direction: column;
    color: white;
    padding-top: 150px;
    align-items: center;
  }
  h1 {
    display: flex;
    flex-direction: column;
  }
  h3 {
    margin-top: 50px;
  }
  img {
    width: 560px;
  }
  #create {
    position: relative;
    bottom: 25px;
    left: 30px;
    margin: -9px
  }
  #review {
    position: relative;
    bottom: 25px;
    left: 30px;
    margin: -9px;
  }

</style>