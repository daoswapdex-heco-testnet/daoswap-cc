<template>
  <div class="fill-height">
    <v-container v-if="web3 && connected" class="fill-height">
      <v-row justify="center">
        <v-col md="6">
          <!-- 认购数据显示 -->
          <v-card justify="center" class="fill-width">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Status") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row align="center">
                <v-col class="body-1" cols="12">
                  <p>
                    {{ $t("OpeningTime") }}：
                    {{ 1625407200 | parseTime("{y}-{m}-{d} {h}:{i}:{s}") }}
                  </p>
                  <p>
                    {{ $t("ClosingTime") }}：
                    {{ 1625407500 | parseTime("{y}-{m}-{d} {h}:{i}:{s}") }}
                  </p>
                  <p>{{ $t("Price") }}：0.5 USDT</p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 认购操作 -->
          <v-card class="fill-width mt-10">
            <!-- 结束 -->
            <v-card outlined>
              <!-- 标题 -->
              <v-card-title>
                <v-avatar size="24" class="mr-2">
                  <img :src="require('@/assets/logo.png')" alt="DAO" />
                </v-avatar>
                <span class="title font-weight-bold text-h5">
                  {{ $t("Status") }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <!-- 不能领取 -->
                <v-row align="center">
                  <v-col class="subtitle-1" cols="12">
                    <v-card-text>
                      <v-row align="center">
                        <v-col class="subtitle-1" cols="12">
                          {{
                            $t(
                              "First stake period is ended, please wait for second period."
                            )
                          }}
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card>
          <!-- 活动历史 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Stake History") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-card-actions class="justify-center">
                <v-btn
                  large
                  width="80%"
                  outlined
                  color="#93B954"
                  @click="gotoHistory"
                >
                  {{ $t("First stake") }}
                </v-btn>
              </v-card-actions>
            </v-card-text>
          </v-card>
          <!-- 当前钱包账号 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-title>
              <span class="title font-weight-bold text-h5">
                {{ $t("Current Token Address") }}
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row align="center">
                <v-col
                  class="body-1"
                  cols="12"
                  @click="handleCopy(address, $event)"
                >
                  <p>
                    {{ address }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 官方说明 -->
          <v-card justify="center" class="fill-width mt-10">
            <v-card-text>
              <v-row align="center">
                <v-col class="body-1" cols="12">
                  <p @click="handleCopy(DAOAddress, $event)">
                    DAO contract: {{ DAOAddress }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                  <p @click="handleCopy(DATAddress, $event)">
                    DAT contract: {{ DATAddress }}
                    <v-icon>mdi-content-copy</v-icon>
                  </p>
                  <p>
                    {{ $t("DAO is offical goverance token for DAOSWAP.") }}
                  </p>
                  <p>
                    {{
                      $t("DAT is PE credential to exchange DAO by staking DAT.")
                    }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <!-- 遮罩层 -->
          <v-overlay z-index="9999" opacity="0.7" :value="loading">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-overlay>
          <!-- 提示层 -->
          <v-snackbar
            v-model="operationResult.snackbar"
            color="success"
            centered
            timeout="3000"
          >
            {{ $t(operationResult.text) }}
          </v-snackbar>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else>
      <v-row justify="center">
        <v-col md="6">
          <!-- 认购数据显示 -->
          <v-card justify="center" class="fill-width">
            <v-card-actions class="justify-center">
              <!-- 连接钱包 -->
              <v-btn
                class="mr-2"
                v-if="!connected"
                color="#93B954"
                block
                @click="onConnect"
              >
                {{ $t("Connect Wallet") }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import clip from "@/utils/clipboard";
import { DATAddress, DAOAddress } from "@/constants";

export default {
  name: "CrowdsaleForRetailEnd",
  data: () => ({
    loading: false,
    DATAddress,
    DAOAddress,
    // 提示框
    operationResult: {
      color: "success",
      snackbar: false,
      text: `Hello`
    }
  }),
  created() {
    if (!this.web3 || !this.connected) {
      this.onConnect();
    }
  },
  computed: {
    connected() {
      return this.$store.state.web3.connected;
    },
    web3() {
      return this.$store.state.web3.web3;
    },
    address() {
      return this.$store.state.web3.address;
    }
  },
  methods: {
    // 连接钱包 OK
    onConnect() {
      this.$store.dispatch("web3/connect");
    },
    // 断开连接钱包 OK
    closeWallet() {
      this.$store.dispatch("web3/closeWallet");
    },
    // 复制地址
    handleCopy(text, event) {
      clip(text, event);
      this.operationResult.snackbar = true;
      this.operationResult.text = "Cope Success";
    },
    // 跳转历史记录
    gotoHistory() {
      this.$router.push({ path: "/stake/period-1" });
    }
  }
};
</script>
