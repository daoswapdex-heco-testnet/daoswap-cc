<template>
  <div class="about">
    <h1>This is an about page</h1>
    <p>DAT地址：{{ DATAddress }}</p>
    <p>DAO地址：{{ DAOAddress }}</p>
  </div>
</template>

<script>
import { DATAddress, DAOAddress } from "@/constants";

export default {
  name: "About",
  data: () => ({
    DATAddress,
    DAOAddress
  })
};
</script>
