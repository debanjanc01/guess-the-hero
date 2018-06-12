package com.cachemorph.heroname;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import java.util.Random;
import java.util.ArrayList;


public class MainActivity extends Activity {

    ImageView image;
    EditText text;//input area for the text
    TextView score_number;//to show the score
    TextView skip_number;//to show the number of skips available
    Button button;//Enter button
    Button button_skip;//skip button
    Button button_ggButton;//gg wp button
    int edit[];//to store the edited pictures
    int real[];//to store the real pictures
    String name[];//to store the corresponding names
    int selected;//variable to pick a picture
    int score;//to store score
    int skip;//to store number of skips available
    Random rand;//random number generator object
    ArrayList <Integer> numbers;//List to store number once generated

    Vibrator vibe; //to make it vibrate

    Animation shake; // to make the image shake

    int sound[];//to store the sounds

    InputMethodManager imm;//to send the score to endScreen Activity

    MediaPlayer mp;//Media player for playing hero names


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        //widget initialization
        image=(ImageView)findViewById(R.id.imageView);
        text=(EditText)findViewById(R.id.editText);
        score_number=(TextView)findViewById(R.id.score_text);
        skip_number=(TextView)findViewById(R.id.skip_number);
        button=(Button)findViewById(R.id.button);
        button_skip=(Button)findViewById(R.id.button_skip);
        button_ggButton=(Button)findViewById(R.id.ggButton);
        rand = new Random();
        numbers= new ArrayList<>();

        //getting values in real edit and name
        setValues();

        //getting first value of selected
        selected = rand.nextInt(edit.length-1);
        numbers.add(selected);
        image.setImageResource(edit[selected]);
        button.setText(R.string.enterText);
        button_skip.setText(R.string.skipText);
        score=0;
        skip=3;
        skip_number.setText(skip+"");
        score_number.setText(score+"");

        //make sure keyboard is present on screen
        text.requestFocus();
        imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.toggleSoftInput(InputMethodManager.SHOW_FORCED, InputMethodManager.HIDE_IMPLICIT_ONLY);

        vibe = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        shake = AnimationUtils.loadAnimation(this,R.anim.shake);

        mp=new MediaPlayer();



    }

    public void onButtonSkipClick(View v)
    {
        if(numbers.size()==edit.length)
        {
            image.setImageResource(real[selected]);
            button.setEnabled(false);
            button.setVisibility(View.INVISIBLE);
            button_skip.setEnabled((false));
            button_skip.setVisibility(View.INVISIBLE);
            text.setVisibility(View.INVISIBLE);
            imm.hideSoftInputFromWindow(text.getWindowToken(), 0);
        }

        else if(!button.isEnabled())
        {
            button.setEnabled(true);
            text.setEnabled(true);
            text.setText("");
            button_skip.setText(R.string.skipText);
            increase();
            image.setImageResource(edit[selected]);
            text.requestFocus();
            imm.toggleSoftInput(InputMethodManager.SHOW_FORCED, InputMethodManager.HIDE_IMPLICIT_ONLY);
        }
        else
        {
            if(skip==0)
            {
                image.setImageResource(real[selected]);
                button.setEnabled(false);
                button.setVisibility(View.INVISIBLE);
                button_skip.setEnabled((false));
                button_skip.setVisibility(View.INVISIBLE);
                text.setVisibility(View.INVISIBLE);
                imm.hideSoftInputFromWindow(text.getWindowToken(), 0);
            }
            else {
                mp.reset();
                mp=MediaPlayer.create(this,R.raw.x_blink_start);
                mp.start();
                text.setText("");
                skip = skip - 1;
                skip_number.setText(skip +"");
                increase();
                image.setImageResource(edit[selected]);
                text.requestFocus();
                imm.toggleSoftInput(InputMethodManager.SHOW_FORCED, InputMethodManager.HIDE_IMPLICIT_ONLY);
            }
        }



    }

    public void onButtonClick(View v)
    {
           //if correct name is given
            if(text.getText().toString().trim().equalsIgnoreCase(name[selected]))
            {
                mp.reset();
                mp=MediaPlayer.create(this,sound[selected]);
                mp.start();
                score=score+10;
                score_number.setText(score+"");
                text.setEnabled(false);
                image.setImageResource(real[selected]);
                button.setEnabled(false);
                button_skip.setText(R.string.nextText);

            }
            else
            {
                mp.reset();
                mp=MediaPlayer.create(this,R.raw.x_no);
                mp.start();
                vibe.vibrate(200);
                image.startAnimation(shake);
            }

    }


    private void increase()
    {

        int temp = rand.nextInt(edit.length);
        while(numbers.contains(temp))
            temp=rand.nextInt(edit.length);
        selected=temp;
        numbers.add(selected);


    }


    private void setValues()
    {
        real=new int[]{R.drawable.abaddon_full, R.drawable.axe_full, R.drawable.bane_full, R.drawable.batrider_full, R.drawable.beastmaster_full,
                R.drawable.bounty_hunter_full, R.drawable.brewmaster_full, R.drawable.centaur_full, R.drawable.chaos_knight_full,
                R.drawable.chen_full, R.drawable.clinkz_full, R.drawable.crystal_maiden_full, R.drawable.dark_seer_full, R.drawable.death_prophet_full,
                R.drawable.disruptor_full, R.drawable.doom_full, R.drawable.drow_ranger_full, R.drawable.enchantress_full, R.drawable.enigma_ful,
                R.drawable.faceless_void_full, R.drawable.gyrocopter_full, R.drawable.huskar_full, R.drawable.jakiro_full, R.drawable.juggernaut_full,
                R.drawable.keeper_of_the_light_full, R.drawable.kunkka_full, R.drawable.leshrac_full, R.drawable.lich_full, R.drawable.life_stealer_full,
                R.drawable.lina_full, R.drawable.lone_druid_full, R.drawable.magnus_full
        };
        edit=new int[]{R.drawable.abaddon_guess, R.drawable.axe_guess, R.drawable.bane_guess, R.drawable.batrider_guess, R.drawable.beastmaster_guess,
                R.drawable.bounty_hunter_guess, R.drawable.brewmaster_guess, R.drawable.centaur_guess, R.drawable.chaos_knight_guess,
                R.drawable.chen_guess, R.drawable.clinkz_guess, R.drawable.crystal_maiden_guess, R.drawable.dark_seer_guess, R.drawable.death_prophet_guess,
                R.drawable.disruptor_guess, R.drawable.doom_guess, R.drawable.drow_ranger_guess, R.drawable.enchantress_guess, R.drawable.enigma_guess,
                R.drawable.faceless_void_guess, R.drawable.gyrocopter_guess, R.drawable.huskar_guess, R.drawable.jakiro_guess, R.drawable.juggernaut_guess,
                R.drawable.keeper_of_the_light_guess, R.drawable.kunkka_guess, R.drawable.leshrac_guess, R.drawable.lich_guess, R.drawable.life_stealer_guess,
                R.drawable.lina_guess, R.drawable.lone_druid_guess, R.drawable.magnus_guess

        };
        name=new String[]{"abaddon","axe","bane","batrider","beastmaster","bounty hunter","brewmaster","centaur warrunner","chaos knight",
                "chen","clinkz","crystal maiden","dark seer","death prophet","disruptor","doom","drow ranger","enchantress",
                "enigma","faceless void","gyrocopter","huskar","jakiro","juggernaut","keeper of the light","kunkka","leshrac",
                "lich","lifestealer","lina","lone druid","magnus"

        };
        sound=new int[]{R.raw.abaddon, R.raw.axe, R.raw.bane, R.raw.batrider, R.raw.beastmaster, R.raw.bountyhunter,
                        R.raw.brewmaster, R.raw.centaur, R.raw.chaos_knight, R.raw.chen, R.raw.clinkz, R.raw.crystal_maiden, R.raw.dark_seer,
                R.raw.death_prophet, R.raw.disruptor, R.raw.doom, R.raw.drow_ranger, R.raw.enchantress, R.raw.enigma, R.raw.faceless_void,
                R.raw.gyrocopter, R.raw.huskar, R.raw.jakiro, R.raw.juggernaut, R.raw.keeper_of_the_light, R.raw.kunkka, R.raw.leshrac,
                R.raw.lich, R.raw.lifestealer, R.raw.lina, R.raw.lone_druid, R.raw.magnus
        };
    }

    private void endGame()
    {
        //Do something to end the game
        Intent in=new Intent(getApplicationContext(),EndGameScreen.class);
        in.putExtra("SCORE",score);
        startActivity(in);
        finish();
    }

    public void onButtonTestClick(View v)
    {
        imm.hideSoftInputFromWindow(text.getWindowToken(), 0);
        endGame();

    }

    protected void onPause()
    {
        super.onPause();
        imm.hideSoftInputFromWindow(text.getWindowToken(), 0);
        mp.stop();

    }

}//end of class
