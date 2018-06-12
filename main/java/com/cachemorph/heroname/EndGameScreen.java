package com.cachemorph.heroname;

/**
 * Created by debanjan on 8/19/2017.
 */

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class EndGameScreen extends Activity{

    MediaPlayer claps;
    MediaPlayer noone;

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(com.cachemorph.heroname.R.layout.end_game);
        TextView scoreText=(TextView)findViewById(R.id.endTextView);
        TextView highScoreText=(TextView)findViewById(R.id.highScoreText);

        claps=MediaPlayer.create(this,R.raw.x_cheering);
        noone=MediaPlayer.create(this,R.raw.x_noone);

        claps.setVolume(0.5f,0.5f);
        claps.start();


        int score=getIntent().getIntExtra("SCORE",0);
        scoreText.setText("Your Score: "+score);

        SharedPreferences prefs=getSharedPreferences("GAME_DATA", Context.MODE_PRIVATE);
        int highScore=prefs.getInt("HIGH_SCORE",0);

        if(score>=highScore)
            noone.start();

        if(score>highScore)
        {
            SharedPreferences.Editor editor=prefs.edit();
            editor.putInt("HIGH_SCORE",score);
            editor.commit();
            highScore=score;

        }

        highScoreText.setText("High Score: "+highScore);

    }

    protected void onPause()
    {
        super.onPause();
        claps.stop();
        noone.stop();
    }

    public void onRestartClick(View v)
    {

        Intent intent=new Intent(EndGameScreen.this,MainActivity.class);
        startActivity(intent);
    }

}
