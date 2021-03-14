package de.mc8051.protochat;

import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.equimaps.capacitorblobwriter.BlobWriter;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        WebSettings webSettings = this.bridge.getWebView().getSettings();

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            if (nightModeFlags == Configuration.UI_MODE_NIGHT_YES)
                webSettings.setForceDark(WebSettings.FORCE_DARK_ON);
            else
                webSettings.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initializes the Bridge
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            // Additional plugins you've installed go here
            // Ex: add(TotallyAwesomePlugin.class);
            add(BlobWriter.class);
        }});
    }
}
