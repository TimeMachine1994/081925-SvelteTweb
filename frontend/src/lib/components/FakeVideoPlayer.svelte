<div class="fake-player">
	<div class="play-button"></div>
</div>

<style>
	.fake-player {
		width: 100%;
		height: 100%;
		background-color: #000;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 0;
		left: 0;
	}

	.play-button {
		width: 0;
		height: 0;
		border-top: 30px solid transparent;
		border-bottom: 30px solid transparent;
		border-left: 50px solid white;
	}
</style>